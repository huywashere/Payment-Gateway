package com.gateway.application.service;

import com.gateway.application.dto.CreateWebhookEndpointRequest;
import com.gateway.application.dto.WebhookEndpointResponse;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookDeliveryEntity;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookEndpointEntity;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookDeliveryRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookEndpointRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookAlertRepository;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookAlertEntity;
import com.gateway.infrastructure.adapter.security.PaymentMetadataVault;
import com.gateway.infrastructure.adapter.security.WebhookUrlPolicy;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WebhookEndpointService {
    private final WebhookEndpointRepository endpointRepository;
    private final WebhookDeliveryRepository deliveryRepository;
    private final AuditService auditService;
    private final WebhookUrlPolicy webhookUrlPolicy;
    private final SubscriptionService subscriptionService;
    private final PaymentMetadataVault vaultService;
    private final ObjectMapper objectMapper;
    private final OutboxService outboxService;
    private final WebhookAlertRepository alertRepository;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public WebhookEndpointResponse create(UUID merchantId, CreateWebhookEndpointRequest request) {
        subscriptionService.assertWebhookAllowed(merchantId,
                endpointRepository.countByMerchantIdAndStatus(merchantId, "ACTIVE"));
        webhookUrlPolicy.validate(request.getUrl());
        String secret = secret();
        Set<String> events = request.getSubscribedEvents() == null || request.getSubscribedEvents().isEmpty()
                ? Set.of("*") : new TreeSet<>(request.getSubscribedEvents());
        String authType = request.getAuthType() == null ? "HMAC_SHA256" : request.getAuthType();
        String encryptedAuthConfig = encryptAuthConfig(authType, request.getAuthConfig());
        validateAlert(request.getAlertChannel(), request.getAlertDestination());
        WebhookEndpointEntity endpoint = endpointRepository.save(WebhookEndpointEntity.builder()
                .merchantId(merchantId).url(request.getUrl()).description(request.getDescription())
                .signingSecret(secret).subscribedEvents(String.join(",", events)).status("ACTIVE")
                .authType(authType).authConfigEncrypted(encryptedAuthConfig)
                .bankCodeFilter(csv(request.getBankCodes())).accountIdFilter(csv(request.getAccountIds()))
                .directionFilter(csv(request.getDirections()))
                .paymentCodePrefixFilter(csv(request.getPaymentCodePrefixes()))
                .alertChannel(request.getAlertChannel()).alertDestination(request.getAlertDestination()).build());
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "webhook_endpoint.created",
                "webhook_endpoint", endpoint.getId().toString(), Map.of("url", endpoint.getUrl()));
        return response(endpoint, secret);
    }

    @Transactional(readOnly = true)
    public List<WebhookEndpointResponse> list(UUID merchantId) {
        return endpointRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(endpoint -> response(endpoint, null)).toList();
    }

    @Transactional
    public void disable(UUID merchantId, UUID endpointId) {
        WebhookEndpointEntity endpoint = endpointRepository.findByIdAndMerchantId(endpointId, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook endpoint not found"));
        endpoint.setStatus("DISABLED");
        endpointRepository.save(endpoint);
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "webhook_endpoint.disabled",
                "webhook_endpoint", endpointId.toString(), null);
    }

    @Transactional
    public void replay(UUID merchantId, UUID deliveryId) {
        WebhookDeliveryEntity delivery = deliveryRepository.findByIdAndMerchantId(deliveryId, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook delivery not found"));
        delivery.setStatus("PENDING");
        delivery.setAttempt(0);
        delivery.setNextAttemptAt(OffsetDateTime.now());
        delivery.setErrorMessage(null);
        deliveryRepository.save(delivery);
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "webhook_delivery.replayed",
                "webhook_delivery", deliveryId.toString(), null);
    }

    @Transactional
    public WebhookEndpointResponse rotateSecret(UUID merchantId, UUID endpointId) {
        WebhookEndpointEntity endpoint = endpointRepository.findByIdAndMerchantId(endpointId, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook endpoint not found"));
        String replacement = secret();
        endpoint.setPreviousSigningSecret(endpoint.getSigningSecret());
        endpoint.setPreviousSecretValidUntil(OffsetDateTime.now().plusHours(24));
        endpoint.setSigningSecret(replacement);
        endpointRepository.save(endpoint);
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "webhook_endpoint.secret_rotated",
                "webhook_endpoint", endpointId.toString(), Map.of("grace_hours", 24));
        return response(endpoint, replacement);
    }

    @Transactional
    public UUID testDelivery(UUID merchantId, UUID endpointId) {
        WebhookEndpointEntity endpoint = endpointRepository.findByIdAndMerchantId(endpointId, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook endpoint not found"));
        var event = outboxService.enqueue(merchantId, "WEBHOOK_ENDPOINT", endpointId,
                "webhook.test", Map.of("endpoint_id", endpointId.toString(), "livemode", false));
        WebhookDeliveryEntity delivery = deliveryRepository.save(WebhookDeliveryEntity.builder()
                .merchantId(merchantId).eventId(event.getId()).endpointId(endpointId)
                .endpointUrl(endpoint.getUrl()).requestPayload(event.getPayload())
                .attempt(0).status("PENDING").nextAttemptAt(OffsetDateTime.now()).build());
        return delivery.getId();
    }

    @Transactional
    public UUID testAlert(UUID merchantId, UUID endpointId) {
        WebhookEndpointEntity endpoint = endpointRepository.findByIdAndMerchantId(endpointId, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Webhook endpoint not found"));
        if (endpoint.getAlertChannel() == null || endpoint.getAlertDestination() == null) {
            throw new IllegalStateException("Endpoint does not have an alert destination");
        }
        return alertRepository.save(WebhookAlertEntity.builder().merchantId(merchantId)
                .endpointId(endpointId).channel(endpoint.getAlertChannel())
                .destination(endpoint.getAlertDestination()).message("Sandbox alert delivery test for " + endpoint.getUrl())
                .build()).getId();
    }

    private String secret() {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        return "whsec_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private WebhookEndpointResponse response(WebhookEndpointEntity endpoint, String rawSecret) {
        return WebhookEndpointResponse.builder().id(endpoint.getId()).object("webhook_endpoint")
                .url(endpoint.getUrl()).description(endpoint.getDescription())
                .subscribedEvents(values(endpoint.getSubscribedEvents()))
                .status(endpoint.getStatus()).signingSecret(rawSecret).authType(endpoint.getAuthType())
                .bankCodes(values(endpoint.getBankCodeFilter())).accountIds(values(endpoint.getAccountIdFilter()))
                .directions(values(endpoint.getDirectionFilter()))
                .paymentCodePrefixes(values(endpoint.getPaymentCodePrefixFilter()))
                .consecutiveFailures(endpoint.getConsecutiveFailures())
                .alertChannel(endpoint.getAlertChannel()).alertDestination(endpoint.getAlertDestination())
                .previousSecretValidUntil(endpoint.getPreviousSecretValidUntil())
                .createdAt(endpoint.getCreatedAt()).build();
    }

    private String encryptAuthConfig(String authType, Map<String, String> config) {
        if ("HMAC_SHA256".equals(authType)) return null;
        Map<String, String> safeConfig = config == null ? Map.of() : new TreeMap<>(config);
        if ("API_KEY".equals(authType)) {
            require(safeConfig, "headerName");
            require(safeConfig, "value");
        } else if ("OAUTH2".equals(authType)) {
            require(safeConfig, "tokenUrl");
            require(safeConfig, "clientId");
            require(safeConfig, "clientSecret");
            webhookUrlPolicy.validate(safeConfig.get("tokenUrl"));
        } else {
            throw new IllegalArgumentException("Unsupported webhook auth type");
        }
        try {
            return vaultService.encrypt(objectMapper.writeValueAsString(safeConfig));
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Webhook auth configuration is invalid", exception);
        }
    }

    private void require(Map<String, String> config, String key) {
        if (config.get(key) == null || config.get(key).isBlank()) {
            throw new IllegalArgumentException("Webhook auth configuration requires " + key);
        }
    }

    private void validateAlert(String channel, String destination) {
        if ((channel == null) != (destination == null) || (destination != null && destination.isBlank())) {
            throw new IllegalArgumentException("Alert channel and destination must be configured together");
        }
    }

    private String csv(Set<String> values) {
        return values == null || values.isEmpty() ? "*" : String.join(",", new TreeSet<>(values));
    }

    private Set<String> values(String csv) {
        return new TreeSet<>(Arrays.asList((csv == null || csv.isBlank() ? "*" : csv).split(",")));
    }
}
