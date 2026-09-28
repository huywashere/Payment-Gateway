package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.entity.OrganizationMemberEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentLinkEntity;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookEndpointEntity;
import com.gateway.infrastructure.adapter.persistence.repository.OrganizationMemberRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentLinkRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookEndpointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SandboxMaintenanceService {
    private final PaymentLinkRepository paymentLinkRepository;
    private final WebhookEndpointRepository webhookEndpointRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final AuditService auditService;

    @Value("${gateway.mode:sandbox}")
    private String gatewayMode;

    @Transactional
    public Map<String, Object> softReset(UUID merchantId) {
        if (!"sandbox".equalsIgnoreCase(gatewayMode)) {
            throw new IllegalStateException("Sandbox reset is disabled outside sandbox mode");
        }

        List<PaymentLinkEntity> links = paymentLinkRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        long canceledLinks = links.stream()
                .filter(link -> "OPEN".equals(link.getStatus()))
                .peek(link -> link.setStatus("CANCELED"))
                .count();
        paymentLinkRepository.saveAll(links);

        List<WebhookEndpointEntity> endpoints = webhookEndpointRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        long disabledEndpoints = endpoints.stream()
                .filter(endpoint -> !"DISABLED".equals(endpoint.getStatus()))
                .peek(endpoint -> endpoint.setStatus("DISABLED"))
                .count();
        webhookEndpointRepository.saveAll(endpoints);

        List<OrganizationMemberEntity> members = organizationMemberRepository.findByMerchantIdOrderByInvitedAtDesc(merchantId);
        long disabledInvites = members.stream()
                .filter(member -> "INVITED".equals(member.getStatus()))
                .peek(member -> member.setStatus("DISABLED"))
                .count();
        organizationMemberRepository.saveAll(members);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("canceledPaymentLinks", canceledLinks);
        result.put("disabledWebhookEndpoints", disabledEndpoints);
        result.put("disabledInvitations", disabledInvites);
        result.put("financialHistoryRetained", true);
        result.put("message", "Sandbox configuration reset; immutable financial history was retained");
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "sandbox.soft_reset",
                "merchant", merchantId.toString(), result);
        return result;
    }
}
