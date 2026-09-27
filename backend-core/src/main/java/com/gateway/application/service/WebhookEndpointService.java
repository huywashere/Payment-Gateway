package com.gateway.application.service;

import com.gateway.application.dto.CreateWebhookEndpointRequest;
import com.gateway.application.dto.WebhookEndpointResponse;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookDeliveryEntity;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookEndpointEntity;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookDeliveryRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookEndpointRepository;
import com.gateway.infrastructure.adapter.security.WebhookUrlPolicy;
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
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public WebhookEndpointResponse create(UUID merchantId, CreateWebhookEndpointRequest request) {
        webhookUrlPolicy.validate(request.getUrl());
        String secret = secret();
        Set<String> events = request.getSubscribedEvents() == null || request.getSubscribedEvents().isEmpty()
                ? Set.of("*") : new TreeSet<>(request.getSubscribedEvents());
        WebhookEndpointEntity endpoint = endpointRepository.save(WebhookEndpointEntity.builder()
                .merchantId(merchantId).url(request.getUrl()).description(request.getDescription())
                .signingSecret(secret).subscribedEvents(String.join(",", events)).status("ACTIVE").build());
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

    private String secret() {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        return "whsec_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private WebhookEndpointResponse response(WebhookEndpointEntity endpoint, String rawSecret) {
        return WebhookEndpointResponse.builder().id(endpoint.getId()).object("webhook_endpoint")
                .url(endpoint.getUrl()).description(endpoint.getDescription())
                .subscribedEvents(new TreeSet<>(Arrays.asList(endpoint.getSubscribedEvents().split(","))))
                .status(endpoint.getStatus()).signingSecret(rawSecret).createdAt(endpoint.getCreatedAt()).build();
    }
}
