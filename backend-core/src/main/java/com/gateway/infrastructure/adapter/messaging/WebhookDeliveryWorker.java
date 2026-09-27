package com.gateway.infrastructure.adapter.messaging;

import com.gateway.infrastructure.adapter.persistence.entity.WebhookDeliveryEntity;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookEndpointEntity;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookDeliveryRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookEndpointRepository;
import com.gateway.infrastructure.adapter.security.HmacSigner;
import com.gateway.infrastructure.adapter.security.WebhookUrlPolicy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookDeliveryWorker {
    private final WebhookDeliveryRepository deliveryRepository;
    private final WebhookEndpointRepository endpointRepository;
    private final HmacSigner hmacSigner;
    private final WebhookUrlPolicy webhookUrlPolicy;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Value("${gateway.webhooks.delivery-enabled:false}")
    private boolean deliveryEnabled;
    @Value("${gateway.webhooks.max-attempts:5}")
    private int maxAttempts;

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
            String signature = hmacSigner.generateWebhookSignature(delivery.getRequestPayload(), endpoint.getSigningSecret());
            URI validatedUri = webhookUrlPolicy.validate(endpoint.getUrl());
            HttpRequest request = HttpRequest.newBuilder(validatedUri)
                    .timeout(Duration.ofSeconds(10)).header("Content-Type", "application/json")
                    .header("User-Agent", "PaymentGateway-Webhooks/1.0")
                    .header("Gateway-Signature", signature)
                    .header("Gateway-Event-Id", delivery.getEventId().toString())
                    .POST(HttpRequest.BodyPublishers.ofString(delivery.getRequestPayload())).build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            delivery.setResponseStatus(response.statusCode());
            delivery.setResponseBody(truncate(response.body(), 4096));
            delivery.setRequestHeaders("{\"Gateway-Signature\":\"" + signature + "\"}");
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
        }
    }

    private void scheduleRetry(WebhookDeliveryEntity delivery, int attempt, String error) {
        delivery.setErrorMessage(truncate(error, 2000));
        if (attempt >= maxAttempts) {
            delivery.setStatus("FAILED");
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
}
