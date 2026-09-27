package com.gateway.application.service;

import com.gateway.application.dto.*;
import com.gateway.infrastructure.adapter.persistence.entity.LedgerAccountEntity;
import com.gateway.infrastructure.adapter.persistence.entity.MerchantEntity;
import com.gateway.infrastructure.adapter.persistence.repository.LedgerAccountRepository;
import com.gateway.infrastructure.adapter.persistence.repository.MerchantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MerchantManagementService {
    private final MerchantRepository merchantRepository;
    private final LedgerAccountRepository ledgerAccountRepository;
    private final ApiKeyService apiKeyService;
    private final AuditService auditService;
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
                .webhookSecret(webhookSecret)
                .build());
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

    private String token(String prefix) {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        return prefix + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
