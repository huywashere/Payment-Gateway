package com.gateway.infrastructure.adapter.messaging;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookDeliveryEntity;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookEndpointEntity;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookAlertEntity;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookAlertRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookDeliveryRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookEndpointRepository;
import com.gateway.infrastructure.adapter.security.HmacSigner;
import com.gateway.infrastructure.adapter.security.PaymentMetadataVault;
import com.gateway.infrastructure.adapter.security.WebhookUrlPolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookDeliveryWorker {
    private final WebhookDeliveryRepository deliveryRepository;
    private final WebhookEndpointRepository endpointRepository;
    private final HmacSigner hmacSigner;
    private final WebhookUrlPolicy webhookUrlPolicy;
    private final PaymentMetadataVault vaultService;
    private final ObjectMapper objectMapper;
    private final WebhookAlertRepository alertRepository;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Value("${gateway.webhooks.delivery-enabled:false}")
    private boolean deliveryEnabled;
    @Value("${gateway.webhooks.max-attempts:5}")
    private int maxAttempts;
    @Value("${gateway.webhooks.store-response-body:false}")
    private boolean storeResponseBody;

    @Scheduled(fixedDelayString = "${gateway.webhooks.poll-interval-ms:2000}")
    @Transactional
    public void deliverDueWebhooks() {
        List<WebhookDeliveryEntity> due = deliveryRepository.findDueDeliveries(OffsetDateTime.now());
        for (WebhookDeliveryEntity delivery : due) deliver(delivery);
    }

    private void deliver(WebhookDeliveryEntity delivery) {
        if (!deliveryEnabled) {
            delivery.setStatus("DISABLED");
            delivery.setErrorMessage("External webhook delivery is disabled in this environment");
            deliveryRepository.save(delivery);
            return;
        }
        WebhookEndpointEntity endpoint = endpointRepository.findById(delivery.getEndpointId()).orElse(null);
        if (endpoint == null || !"ACTIVE".equals(endpoint.getStatus())) {
            delivery.setStatus("FAILED");
            delivery.setErrorMessage("Webhook endpoint is missing or inactive");
            deliveryRepository.save(delivery);
            return;
        }
        int attempt = delivery.getAttempt() + 1;
        long started = System.nanoTime();
        try {
            URI validatedUri = webhookUrlPolicy.validate(endpoint.getUrl());
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder(validatedUri)
                    .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                    .header("User-Agent", "PaymentGateway-Webhooks/1.0")
                    .header("Gateway-Event-Id", delivery.getEventId().toString())
                    .POST(HttpRequest.BodyPublishers.ofString(delivery.getRequestPayload()));
            Map<String, String> loggedHeaders = applyAuthentication(requestBuilder, endpoint, delivery.getRequestPayload());
            HttpRequest request = requestBuilder.build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            delivery.setResponseStatus(response.statusCode());
            delivery.setResponseBody(storeResponseBody ? truncate(response.body(), 4096) : null);
            delivery.setRequestHeaders(objectMapper.writeValueAsString(loggedHeaders));
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                delivery.setStatus("SUCCESS");
                delivery.setErrorMessage(null);
                delivery.setNextAttemptAt(null);
            } else {
                scheduleRetry(delivery, attempt, "Endpoint returned HTTP " + response.statusCode());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            scheduleRetry(delivery, attempt, "Webhook delivery interrupted");
        } catch (Exception e) {
            scheduleRetry(delivery, attempt, e.getClass().getSimpleName() + ": " + e.getMessage());
        } finally {
            delivery.setAttempt(attempt);
            delivery.setDurationMs((int) Duration.ofNanos(System.nanoTime() - started).toMillis());
            deliveryRepository.save(delivery);
            updateEndpointHealth(endpoint, delivery);
        }
    }

    private void scheduleRetry(WebhookDeliveryEntity delivery, int attempt, String error) {
        delivery.setErrorMessage(truncate(error, 2000));
        if (attempt >= maxAttempts) {
            delivery.setStatus("DEAD_LETTER");
            delivery.setNextAttemptAt(null);
            return;
        }
        delivery.setStatus("RETRYING");
        long delaySeconds = Math.min(900, 15L * (1L << Math.min(attempt - 1, 6)));
        delivery.setNextAttemptAt(OffsetDateTime.now().plusSeconds(delaySeconds));
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) return value;
        return value.substring(0, maxLength);
    }

    Map<String, String> applyAuthentication(HttpRequest.Builder builder,
                                            WebhookEndpointEntity endpoint,
                                            String payload) throws Exception {
        Map<String, String> logged = new LinkedHashMap<>();
        String authType = endpoint.getAuthType() == null ? "HMAC_SHA256" : endpoint.getAuthType();
        if ("HMAC_SHA256".equals(authType)) {
            builder.header("Gateway-Signature", hmacSigner.generateWebhookSignature(payload, endpoint.getSigningSecret()));
            logged.put("Gateway-Signature", "redacted");
        } else if ("API_KEY".equals(authType)) {
            Map<String, String> config = authConfig(endpoint);
            builder.header(config.get("headerName"), config.get("value"));
            logged.put(config.get("headerName"), "redacted");
        } else if ("OAUTH2".equals(authType)) {
            String token = fetchOAuthToken(authConfig(endpoint));
            builder.header("Authorization", "Bearer " + token);
            logged.put("Authorization", "Bearer redacted");
        } else {
            throw new IllegalArgumentException("Unsupported webhook auth type: " + authType);
        }
        return logged;
    }

    private Map<String, String> authConfig(WebhookEndpointEntity endpoint) throws Exception {
        if (endpoint.getAuthConfigEncrypted() == null) {
            throw new IllegalStateException("Webhook authentication configuration is missing");
        }
        return objectMapper.readValue(vaultService.decrypt(endpoint.getAuthConfigEncrypted()),
                new TypeReference<>() {});
    }

    private String fetchOAuthToken(Map<String, String> config) throws Exception {
        URI tokenUri = webhookUrlPolicy.validate(config.get("tokenUrl"));
        String form = "grant_type=client_credentials&client_id=" + encode(config.get("clientId"))
                + "&client_secret=" + encode(config.get("clientSecret"));
        if (config.get("scope") != null && !config.get("scope").isBlank()) {
            form += "&scope=" + encode(config.get("scope"));
        }
        HttpRequest request = HttpRequest.newBuilder(tokenUri).timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(form)).build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("OAuth token endpoint returned HTTP " + response.statusCode());
        }
        JsonNode token = objectMapper.readTree(response.body()).path("access_token");
        if (!token.isTextual() || token.asText().isBlank()) {
            throw new IllegalStateException("OAuth token response did not contain access_token");
        }
        return token.asText();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private void updateEndpointHealth(WebhookEndpointEntity endpoint, WebhookDeliveryEntity delivery) {
        if ("SUCCESS".equals(delivery.getStatus())) {
            endpoint.setConsecutiveFailures(0);
        } else if (!"DISABLED".equals(delivery.getStatus())) {
            int failures = (endpoint.getConsecutiveFailures() == null ? 0 : endpoint.getConsecutiveFailures()) + 1;
            endpoint.setConsecutiveFailures(failures);
            if (failures == 3 && endpoint.getAlertChannel() != null && endpoint.getAlertDestination() != null) {
                alertRepository.save(WebhookAlertEntity.builder()
                        .merchantId(delivery.getMerchantId()).endpointId(endpoint.getId()).deliveryId(delivery.getId())
                        .channel(endpoint.getAlertChannel()).destination(endpoint.getAlertDestination())
                        .message("Webhook endpoint failed 3 consecutive deliveries: " + endpoint.getUrl()).build());
            }
        }
        endpointRepository.save(endpoint);
    }
}
