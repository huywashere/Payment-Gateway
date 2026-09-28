package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.entity.OrganizationMemberEntity;
import com.gateway.infrastructure.adapter.persistence.repository.OrganizationMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class OrganizationService {
    private static final Set<String> ROLES = Set.of("OWNER", "DEVELOPER", "FINANCE", "AUDITOR");
    private final OrganizationMemberRepository repository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<OrganizationMemberEntity> list(UUID merchantId) {
        return repository.findByMerchantIdOrderByInvitedAtDesc(merchantId);
    }

    @Transactional
    public OrganizationMemberEntity invite(UUID merchantId, String email, String displayName, String role) {
        String normalizedRole = role.toUpperCase(Locale.ROOT);
        if (!ROLES.contains(normalizedRole)) throw new IllegalArgumentException("Unsupported organization role");
        OrganizationMemberEntity member = repository.save(OrganizationMemberEntity.builder()
                .merchantId(merchantId).email(email.trim().toLowerCase(Locale.ROOT)).displayName(displayName)
                .role(normalizedRole).status("INVITED").build());
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "organization_member.invited",
                "organization_member", member.getId().toString(), Map.of("role", normalizedRole));
        return member;
    }

    @Transactional
    public OrganizationMemberEntity update(UUID merchantId, UUID id, String role, String status) {
        OrganizationMemberEntity member = repository.findByIdAndMerchantId(id, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Organization member not found"));
        String requestedRole = role == null ? member.getRole() : role.toUpperCase(Locale.ROOT);
        String requestedStatus = status == null ? member.getStatus() : status.toUpperCase(Locale.ROOT);
        boolean removesActiveOwner = "OWNER".equals(member.getRole()) && "ACTIVE".equals(member.getStatus())
                && (!"OWNER".equals(requestedRole) || !"ACTIVE".equals(requestedStatus));
        if (removesActiveOwner && repository.countByMerchantIdAndRoleAndStatus(merchantId, "OWNER", "ACTIVE") <= 1) {
            throw new IllegalArgumentException("Organization must keep at least one active owner");
        }
        if (role != null) {
            String normalized = requestedRole;
            if (!ROLES.contains(normalized)) throw new IllegalArgumentException("Unsupported organization role");
            member.setRole(normalized);
        }
        if (status != null) {
            String normalized = requestedStatus;
            if (!Set.of("INVITED", "ACTIVE", "DISABLED").contains(normalized)) throw new IllegalArgumentException("Unsupported member status");
            member.setStatus(normalized);
            if ("ACTIVE".equals(normalized) && member.getJoinedAt() == null) member.setJoinedAt(OffsetDateTime.now());
        }
        return repository.save(member);
    }
}
