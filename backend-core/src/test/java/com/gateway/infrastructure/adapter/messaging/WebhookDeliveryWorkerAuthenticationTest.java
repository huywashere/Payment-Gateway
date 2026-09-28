package com.gateway.infrastructure.adapter.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookEndpointEntity;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookAlertRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookDeliveryRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookEndpointRepository;
import com.gateway.infrastructure.adapter.security.HmacSigner;
import com.gateway.infrastructure.adapter.security.PaymentMetadataVault;
import com.gateway.infrastructure.adapter.security.WebhookUrlPolicy;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;

import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class WebhookDeliveryWorkerAuthenticationTest {

    @Test
    void addsConfiguredApiKeyWithoutLoggingItsValue() throws Exception {
        PaymentMetadataVault vault = mock(PaymentMetadataVault.class);
        when(vault.decrypt("encrypted")).thenReturn("{\"headerName\":\"X-Api-Key\",\"value\":\"top-secret\"}");
        var worker = worker(vault, mock(WebhookUrlPolicy.class));
        var endpoint = WebhookEndpointEntity.builder().authType("API_KEY").authConfigEncrypted("encrypted").build();
        var builder = HttpRequest.newBuilder(URI.create("https://merchant.example/webhook"));

        var logged = worker.applyAuthentication(builder, endpoint, "{}");
        var request = builder.build();

        assertThat(request.headers().firstValue("X-Api-Key")).contains("top-secret");
        assertThat(logged).containsEntry("X-Api-Key", "redacted").doesNotContainValue("top-secret");
    }

    @Test
    void exchangesClientCredentialsAndAddsBearerToken() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/token", exchange -> {
            byte[] body = "{\"access_token\":\"oauth-token\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            String tokenUrl = "http://127.0.0.1:" + server.getAddress().getPort() + "/token";
            PaymentMetadataVault vault = mock(PaymentMetadataVault.class);
            when(vault.decrypt("encrypted")).thenReturn("{\"tokenUrl\":\"" + tokenUrl + "\",\"clientId\":\"client\",\"clientSecret\":\"secret\",\"scope\":\"payments\"}");
            WebhookUrlPolicy policy = mock(WebhookUrlPolicy.class);
            when(policy.validate(anyString())).thenAnswer(invocation -> URI.create(invocation.getArgument(0)));
            var worker = worker(vault, policy);
            var endpoint = WebhookEndpointEntity.builder().authType("OAUTH2").authConfigEncrypted("encrypted").build();
            var builder = HttpRequest.newBuilder(URI.create("https://merchant.example/webhook"));

            var logged = worker.applyAuthentication(builder, endpoint, "{}");
            var request = builder.build();

            assertThat(request.headers().firstValue("Authorization")).contains("Bearer oauth-token");
            assertThat(logged).containsEntry("Authorization", "Bearer redacted");
        } finally {
            server.stop(0);
        }
    }

    private WebhookDeliveryWorker worker(PaymentMetadataVault vault, WebhookUrlPolicy policy) {
        return new WebhookDeliveryWorker(mock(WebhookDeliveryRepository.class), mock(WebhookEndpointRepository.class),
                new HmacSigner(), policy, vault, new ObjectMapper(), mock(WebhookAlertRepository.class));
    }
}
