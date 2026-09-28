package com.gateway.application.service;

import com.gateway.application.dto.BankAccountResponse;
import com.gateway.application.dto.CreateBankAccountRequest;
import com.gateway.infrastructure.adapter.persistence.entity.BankAccountEntity;
import com.gateway.infrastructure.adapter.persistence.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class BankAccountService {
    private static final Map<String, String> BINS = Map.ofEntries(
            Map.entry("ACB", "970416"), Map.entry("BIDV", "970418"),
            Map.entry("VIETINBANK", "970415"), Map.entry("ICB", "970415"),
            Map.entry("NCB", "970419"), Map.entry("VCB", "970436"),
            Map.entry("TCB", "970407"), Map.entry("MB", "970422"),
            Map.entry("VPB", "970432"), Map.entry("TPB", "970423"),
            Map.entry("VIB", "970441"), Map.entry("STB", "970403"),
            Map.entry("OCB", "970448"), Map.entry("MSB", "970426"),
            Map.entry("SHBVN", "970424"), Map.entry("COOPBANK", "970446"));
    private final BankAccountRepository repository;
    private final SubscriptionService subscriptionService;
    private final AuditService auditService;

    @Transactional
    public BankAccountResponse create(UUID merchantId, CreateBankAccountRequest request) {
        subscriptionService.assertBankAccountAllowed(merchantId, repository.countByMerchantIdAndStatusNot(merchantId, "DISABLED"));
        String bankCode = request.getBankCode().trim().toUpperCase(Locale.ROOT);
        String bankBin = Optional.ofNullable(BINS.get(bankCode))
                .orElseThrow(() -> new IllegalArgumentException("Unsupported bank code: " + bankCode));
        if (request.isDefaultAccount()) clearDefault(merchantId);
        BankAccountEntity entity = repository.save(BankAccountEntity.builder()
                .merchantId(merchantId).bankCode(bankCode).bankBin(bankBin)
                .accountNumber(request.getAccountNumber().trim().toUpperCase(Locale.ROOT))
                .accountName(request.getAccountName().trim().toUpperCase(Locale.ROOT))
                .accountType(request.getAccountType() == null ? "BUSINESS" : request.getAccountType().toUpperCase(Locale.ROOT))
                .connectionMode("MANUAL").status("ACTIVE").defaultAccount(request.isDefaultAccount()).build());
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "bank_account.created",
                "bank_account", entity.getId().toString(), Map.of("bank_code", bankCode));
        return response(entity);
    }

    @Transactional(readOnly = true)
    public List<BankAccountResponse> list(UUID merchantId) {
        return repository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream().map(this::response).toList();
    }

    @Transactional
    public BankAccountResponse makeDefault(UUID merchantId, UUID id) {
        BankAccountEntity entity = owned(merchantId, id);
        if (!"ACTIVE".equals(entity.getStatus())) throw new IllegalStateException("Only active bank accounts can be default");
        clearDefault(merchantId);
        entity.setDefaultAccount(true);
        return response(repository.save(entity));
    }

    @Transactional
    public void disable(UUID merchantId, UUID id) {
        BankAccountEntity entity = owned(merchantId, id);
        entity.setStatus("DISABLED");
        entity.setDefaultAccount(false);
        repository.save(entity);
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "bank_account.disabled",
                "bank_account", id.toString(), null);
    }

    @Transactional
    public BankAccountResponse sync(UUID merchantId, UUID id) {
        BankAccountEntity entity = owned(merchantId, id);
        if ("DISABLED".equals(entity.getStatus())) throw new IllegalStateException("Disabled bank account cannot be synchronized");
        entity.setStatus("ACTIVE");
        entity.setLastSyncedAt(OffsetDateTime.now(ZoneOffset.UTC));
        repository.save(entity);
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "bank_account.synced",
                "bank_account", id.toString(), Map.of("bank_code", entity.getBankCode()));
        return response(entity);
    }

    BankAccountEntity owned(UUID merchantId, UUID id) {
        return repository.findByIdAndMerchantId(id, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Bank account not found"));
    }

    BankAccountEntity defaultAccount(UUID merchantId) {
        return repository.findFirstByMerchantIdAndDefaultAccountTrueAndStatus(merchantId, "ACTIVE")
                .orElseThrow(() -> new IllegalStateException("An active default bank account is required"));
    }

    private void clearDefault(UUID merchantId) {
        repository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .filter(BankAccountEntity::isDefaultAccount).forEach(account -> {
                    account.setDefaultAccount(false); repository.save(account);
                });
    }

    private BankAccountResponse response(BankAccountEntity entity) {
        String number = entity.getAccountNumber();
        String masked = number.length() <= 4 ? number : "•".repeat(number.length() - 4) + number.substring(number.length() - 4);
        return BankAccountResponse.builder().id(entity.getId()).object("bank_account")
                .bankCode(entity.getBankCode()).bankBin(entity.getBankBin()).accountNumberMasked(masked)
                .accountName(entity.getAccountName()).accountType(entity.getAccountType())
                .connectionMode(entity.getConnectionMode()).status(entity.getStatus())
                .defaultAccount(entity.isDefaultAccount()).lastSyncedAt(entity.getLastSyncedAt())
                .createdAt(entity.getCreatedAt()).build();
    }
}
