package com.gateway.infrastructure.adapter.messaging;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookDeliveryEntity;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookEndpointEntity;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookDeliveryRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookEndpointRepository;
import com.gateway.infrastructure.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebhookDispatcherConsumer {
    private final WebhookDeliveryRepository deliveryRepository;
    private final WebhookEndpointRepository endpointRepository;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    @Transactional
    public void consumeWebhookEvent(String message) {
        try {
            JsonNode wrapper = objectMapper.readTree(message);
            UUID eventId = UUID.fromString(wrapper.path("outboxEventId").asText());
            JsonNode payload = wrapper.path("payload");
            UUID merchantId = UUID.fromString(payload.path("merchant_id").asText());
            String eventType = wrapper.path("eventType").asText();
            List<WebhookEndpointEntity> endpoints = endpointRepository.findByMerchantIdAndStatus(merchantId, "ACTIVE");
            for (WebhookEndpointEntity endpoint : endpoints) {
                if (!subscribed(endpoint.getSubscribedEvents(), eventType)) continue;
                if (!matchesFilters(endpoint, payload)) continue;
                if (deliveryRepository.existsByEventIdAndEndpointId(eventId, endpoint.getId())) continue;
                deliveryRepository.save(WebhookDeliveryEntity.builder()
                        .merchantId(merchantId).eventId(eventId).endpointId(endpoint.getId())
                        .endpointUrl(endpoint.getUrl()).requestPayload(payload.toString())
                        .attempt(0).status("PENDING").nextAttemptAt(OffsetDateTime.now()).build());
            }
            log.info("Queued {} webhook delivery candidate(s) for event {}", endpoints.size(), eventId);
        } catch (Exception e) {
            log.error("Could not materialize webhook deliveries", e);
            throw new IllegalStateException("Webhook event could not be consumed", e);
        }
    }

    private boolean subscribed(String subscriptions, String eventType) {
        if (subscriptions == null || subscriptions.isBlank() || "*".equals(subscriptions)) return true;
        for (String value : subscriptions.split(",")) {
            if (value.trim().equals(eventType)) return true;
        }
        return false;
    }

    private boolean matchesFilters(WebhookEndpointEntity endpoint, JsonNode envelope) {
        JsonNode object = envelope.path("data").path("object");
        return matches(endpoint.getBankCodeFilter(), text(object, "bank_code"))
                && matches(endpoint.getAccountIdFilter(), text(object, "bank_account_id"))
                && matches(endpoint.getDirectionFilter(), text(object, "direction"))
                && matchesPrefix(endpoint.getPaymentCodePrefixFilter(), text(object, "payment_code"));
    }

    private String text(JsonNode object, String field) {
        JsonNode value = object.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }

    private boolean matches(String csv, String value) {
        if (csv == null || csv.isBlank() || "*".equals(csv)) return true;
        if (value == null) return false;
        for (String candidate : csv.split(",")) {
            if (candidate.trim().equalsIgnoreCase(value)) return true;
        }
        return false;
    }

    private boolean matchesPrefix(String csv, String value) {
        if (csv == null || csv.isBlank() || "*".equals(csv)) return true;
        if (value == null) return false;
        for (String prefix : csv.split(",")) {
            if (value.regionMatches(true, 0, prefix.trim(), 0, prefix.trim().length())) return true;
        }
        return false;
    }
}
