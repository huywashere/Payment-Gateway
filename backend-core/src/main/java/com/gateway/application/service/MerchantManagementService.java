package com.gateway.application.service;

import com.gateway.application.dto.*;
import com.gateway.infrastructure.adapter.persistence.entity.LedgerAccountEntity;
import com.gateway.infrastructure.adapter.persistence.entity.MerchantEntity;
import com.gateway.infrastructure.adapter.persistence.repository.LedgerAccountRepository;
import com.gateway.infrastructure.adapter.persistence.repository.MerchantRepository;
import com.gateway.infrastructure.adapter.persistence.repository.MerchantSubscriptionRepository;
import com.gateway.infrastructure.adapter.persistence.repository.OrganizationMemberRepository;
import com.gateway.infrastructure.adapter.persistence.entity.MerchantSubscriptionEntity;
import com.gateway.infrastructure.adapter.persistence.entity.OrganizationMemberEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;

@Service
@RequiredArgsConstructor
public class MerchantManagementService {
    private final MerchantRepository merchantRepository;
    private final LedgerAccountRepository ledgerAccountRepository;
    private final ApiKeyService apiKeyService;
    private final AuditService auditService;
    private final MerchantSubscriptionRepository subscriptionRepository;
    private final OrganizationMemberRepository memberRepository;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public MerchantOnboardingResponse onboard(CreateMerchantRequest request) {
        merchantRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .ifPresent(existing -> { throw new IllegalStateException("A merchant with this email already exists"); });
        String webhookSecret = token("whsec_");
        MerchantEntity merchant = merchantRepository.save(MerchantEntity.builder()
                .businessName(request.getBusinessName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .status("ACTIVE")
                .onboardingStatus("ACTIVE").kybStatus("NOT_STARTED")
                .webhookSecret(webhookSecret)
                .build());
        OffsetDateTime periodStart = OffsetDateTime.now(ZoneOffset.UTC).withDayOfMonth(1)
                .toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
        subscriptionRepository.save(MerchantSubscriptionEntity.builder().merchantId(merchant.getId())
                .planCode("FREE").status("ACTIVE").currentPeriodStart(periodStart)
                .currentPeriodEnd(periodStart.plusMonths(1)).build());
        memberRepository.save(OrganizationMemberEntity.builder().merchantId(merchant.getId())
                .email(merchant.getEmail()).displayName(merchant.getBusinessName() + " Owner")
                .role("OWNER").status("ACTIVE").joinedAt(OffsetDateTime.now()).build());
        String suffix = merchant.getId().toString().substring(0, 8).toUpperCase();
        ledgerAccountRepository.save(LedgerAccountEntity.builder().merchantId(merchant.getId())
                .accountCode("2001_MERCHANT_PENDING_" + suffix).accountName("Merchant pending balance")
                .accountType("LIABILITY").currency("VND").build());
        ledgerAccountRepository.save(LedgerAccountEntity.builder().merchantId(merchant.getId())
                .accountCode("2002_MERCHANT_AVAILABLE_" + suffix).accountName("Merchant available balance")
                .accountType("LIABILITY").currency("VND").build());
        ledgerAccountRepository.save(LedgerAccountEntity.builder().merchantId(merchant.getId())
                .accountCode("2003_MERCHANT_DISPUTE_RESERVE_" + suffix).accountName("Merchant dispute reserve")
                .accountType("LIABILITY").currency("VND").build());
        ApiKeyResponse secret = apiKeyService.create(merchant.getId(), CreateApiKeyRequest.builder()
                .displayName("Default test secret key").keyType("SECRET").environment("TEST").build(), "platform");
        ApiKeyResponse publishable = apiKeyService.create(merchant.getId(), CreateApiKeyRequest.builder()
                .displayName("Default test publishable key").keyType("PUBLISHABLE").environment("TEST").build(), "platform");
        auditService.record(merchant.getId(), "PLATFORM_ADMIN", "platform", "merchant.onboarded",
                "merchant", merchant.getId().toString(), null);
        return MerchantOnboardingResponse.builder().id(merchant.getId()).object("merchant")
                .businessName(merchant.getBusinessName()).email(merchant.getEmail()).status(merchant.getStatus())
                .testSecretKey(secret.getSecret()).testPublishableKey(publishable.getSecret())
                .webhookSigningSecret(webhookSecret).createdAt(merchant.getCreatedAt()).build();
    }

    @Transactional(readOnly = true)
    public List<PlatformMerchantResponse> list() {
        return merchantRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::platformResponse).toList();
    }

    @Transactional
    public PlatformMerchantResponse update(UUID merchantId, UpdateMerchantRequest request) {
        MerchantEntity merchant = merchantRepository.findById(merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Merchant not found"));
        if (request.getStatus() != null) merchant.setStatus(request.getStatus().toUpperCase(Locale.ROOT));
        if (request.getOnboardingStatus() != null) {
            merchant.setOnboardingStatus(request.getOnboardingStatus().toUpperCase(Locale.ROOT));
        }
        if (request.getKybStatus() != null) merchant.setKybStatus(request.getKybStatus().toUpperCase(Locale.ROOT));
        if (request.getLegalName() != null) merchant.setLegalName(request.getLegalName().trim());
        merchantRepository.save(merchant);
        auditService.record(merchantId, "PLATFORM_ADMIN", "platform", "merchant.updated",
                "merchant", merchantId.toString(), java.util.Map.of(
                        "status", merchant.getStatus(), "kyb_status", merchant.getKybStatus()));
        return platformResponse(merchant);
    }

    private PlatformMerchantResponse platformResponse(MerchantEntity merchant) {
        String plan = subscriptionRepository.findById(merchant.getId())
                .map(MerchantSubscriptionEntity::getPlanCode).orElse("NONE");
        return PlatformMerchantResponse.builder().id(merchant.getId()).object("merchant")
                .businessName(merchant.getBusinessName()).legalName(merchant.getLegalName())
                .email(merchant.getEmail()).status(merchant.getStatus())
                .onboardingStatus(merchant.getOnboardingStatus()).kybStatus(merchant.getKybStatus())
                .plan(plan).createdAt(merchant.getCreatedAt()).updatedAt(merchant.getUpdatedAt()).build();
    }

    private String token(String prefix) {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        return prefix + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
