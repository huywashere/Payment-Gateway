package com.gateway.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.*;
import com.gateway.infrastructure.adapter.persistence.entity.BankAccountEntity;
import com.gateway.infrastructure.adapter.persistence.repository.BankAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpenBankingWebhookService {
    private static final UUID DEMO_MERCHANT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final BankAccountRepository accountRepository;
    private final BankTransactionService bankTransactionService;
    private final ObjectMapper objectMapper;

    @Value("${gateway.open-banking.sepay-api-key:}")
    private String sepayApiKey;

    @Value("${gateway.open-banking.payos-checksum-key:}")
    private String payosChecksumKey;

    @Transactional
    public BankTransactionResponse processSepay(String authHeader, String apiKeyHeader, String rawPayload) {
        if (sepayApiKey != null && !sepayApiKey.isBlank()) {
            String token = extractToken(authHeader, apiKeyHeader);
            if (!sepayApiKey.equals(token)) {
                log.warn("SePay webhook rejected: unauthorized token");
                throw new IllegalArgumentException("Invalid SePay API token");
            }
        }

        SepayWebhookPayload payload;
        try {
            payload = objectMapper.readValue(rawPayload, SepayWebhookPayload.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid SePay payload format", e);
        }

        BankAccountEntity account = resolveAccount(payload.getAccountNumber());
        BankTransactionIngestRequest request = new BankTransactionIngestRequest();
        request.setBankAccountId(account.getId());
        request.setExternalReference(payload.getReferenceNumber() != null && !payload.getReferenceNumber().isBlank()
                ? payload.getReferenceNumber() : "SEPAY-" + (payload.getId() != null ? payload.getId() : UUID.randomUUID()));
        request.setDirection("IN");
        request.setAmount(payload.getAmountIn() != null ? payload.getAmountIn() : 0L);
        request.setCurrency("VND");
        request.setDescription(payload.getTransactionContent() != null ? payload.getTransactionContent() : payload.getBody());
        request.setCounterpartyAccount(payload.getSubAccount());
        request.setOccurredAt(OffsetDateTime.now());

        log.info("Processing SePay webhook for account {} with amount {} VND, content: {}",
                account.getAccountNumber(), request.getAmount(), request.getDescription());

        return bankTransactionService.ingestDirect(account, request, rawPayload);
    }

    @Transactional
    public BankTransactionResponse processPayOs(String rawPayload) {
        PayOsWebhookPayload payload;
        try {
            payload = objectMapper.readValue(rawPayload, PayOsWebhookPayload.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid PayOS payload format", e);
        }

        if (payload.getData() == null) {
            throw new IllegalArgumentException("PayOS webhook data is missing");
        }

        var data = payload.getData();
        BankAccountEntity account = resolveAccount(data.getAccountNumber());
        BankTransactionIngestRequest request = new BankTransactionIngestRequest();
        request.setBankAccountId(account.getId());
        request.setExternalReference(data.getReference() != null && !data.getReference().isBlank()
                ? data.getReference() : "PAYOS-" + (data.getOrderCode() != null ? data.getOrderCode() : UUID.randomUUID()));
        request.setDirection("IN");
        request.setAmount(data.getAmount() != null ? data.getAmount() : 0L);
        request.setCurrency(data.getCurrency() != null ? data.getCurrency() : "VND");
        request.setDescription(data.getDescription());
        request.setCounterpartyAccount(null);
        request.setOccurredAt(OffsetDateTime.now());

        log.info("Processing PayOS webhook for account {} with amount {} VND, content: {}",
                account.getAccountNumber(), request.getAmount(), request.getDescription());

        return bankTransactionService.ingestDirect(account, request, rawPayload);
    }

    private BankAccountEntity resolveAccount(String accountNumber) {
        if (accountNumber != null && !accountNumber.isBlank()) {
            var found = accountRepository.findFirstByAccountNumberAndStatus(accountNumber.trim(), "ACTIVE");
            if (found.isPresent()) return found.get();
        }

        // Fallback: merchant default active account
        return accountRepository.findFirstByMerchantIdAndDefaultAccountTrueAndStatus(DEMO_MERCHANT_ID, "ACTIVE")
                .or(() -> accountRepository.findAll().stream().filter(a -> "ACTIVE".equalsIgnoreCase(a.getStatus())).findFirst())
                .orElseThrow(() -> new IllegalStateException("No active bank account configured in NovaGate to receive transactions"));
    }

    private String extractToken(String authHeader, String apiKeyHeader) {
        if (apiKeyHeader != null && !apiKeyHeader.isBlank()) return apiKeyHeader.trim();
        if (authHeader != null && !authHeader.isBlank()) {
            if (authHeader.regionMatches(true, 0, "Apikey ", 0, 7)) {
                return authHeader.substring(7).trim();
            }
            if (authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
                return authHeader.substring(7).trim();
            }
            return authHeader.trim();
        }
        return null;
    }
}
