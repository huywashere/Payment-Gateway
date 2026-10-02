package com.gateway.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.BankTransactionIngestRequest;
import com.gateway.application.dto.BankTransactionResponse;
import com.gateway.infrastructure.adapter.persistence.entity.*;
import com.gateway.infrastructure.adapter.persistence.repository.*;
import com.gateway.infrastructure.adapter.processor.BankSandboxProperties;
import com.gateway.infrastructure.adapter.processor.SandboxBank;
import com.gateway.infrastructure.adapter.security.HmacSigner;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import com.gateway.application.event.PaymentLinkStatusChanged;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class BankTransactionService {
    private final BankTransactionRepository transactionRepository;
    private final BankAccountRepository accountRepository;
    private final PaymentLinkRepository linkRepository;
    private final PaymentIntentRepository intentRepository;
    private final PaymentIntentService paymentIntentService;
    private final HmacSigner signer;
    private final BankSandboxProperties properties;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public BankTransactionResponse ingest(String bankCode, BankTransactionIngestRequest request,
                                          String rawPayload, String signature) {
        SandboxBank bank = SandboxBank.fromCode(bankCode);
        if (signature == null || !signer.verifySignature(rawPayload, signature,
                properties.credentials(bank).callbackSecret(), 300)) {
            throw new IllegalArgumentException("Invalid or expired bank transaction signature");
        }
        BankAccountEntity account = accountRepository.findForUpdateById(request.getBankAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Bank account not found"));
        if (!bank.name().equals(account.getBankCode())) throw new IllegalArgumentException("Bank account does not match callback bank");
        return ingestDirect(account, request, rawPayload);
    }

    @Transactional
    public BankTransactionResponse ingestDirect(BankAccountEntity account, BankTransactionIngestRequest request,
                                                String rawPayload) {
        String payloadHash = sha256(rawPayload);
        BankTransactionEntity duplicate = transactionRepository
                .findByBankAccountIdAndExternalReference(account.getId(), request.getExternalReference()).orElse(null);
        if (duplicate != null) {
            if (!MessageDigest.isEqual(payloadHash.getBytes(StandardCharsets.UTF_8),
                    duplicate.getPayloadHash().getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Bank reference was reused with a different payload");
            }
            return response(duplicate, account.getBankCode());
        }
        BankTransactionEntity transaction = transactionRepository.save(BankTransactionEntity.builder()
                .merchantId(account.getMerchantId()).bankAccountId(account.getId())
                .externalReference(request.getExternalReference()).direction(request.getDirection())
                .amount(request.getAmount()).currency(request.getCurrency().toUpperCase(Locale.ROOT))
                .description(request.getDescription()).counterpartyAccount(request.getCounterpartyAccount())
                .occurredAt(request.getOccurredAt()).rawPayload(writeJson(request)).payloadHash(payloadHash)
                .matchStatus("RECEIVED").build());
        if ("IN".equals(transaction.getDirection())) match(transaction, account);
        else transaction.setMatchStatus("UNMATCHED");
        transactionRepository.save(transaction);
        auditService.record(account.getMerchantId(), "BANK_CALLBACK", account.getBankCode(), "bank_transaction.received",
                "bank_transaction", transaction.getId().toString(), Map.of("match_status", transaction.getMatchStatus()));
        return response(transaction, account.getBankCode());
    }

    @Transactional(readOnly = true)
    public List<BankTransactionResponse> list(UUID merchantId, int limit) {
        int bounded = Math.max(1, Math.min(limit, 100));
        return transactionRepository.findByMerchantIdOrderByReceivedAtDesc(merchantId, PageRequest.of(0, bounded))
                .stream().map(item -> response(item, accountRepository.findById(item.getBankAccountId())
                        .map(BankAccountEntity::getBankCode).orElse("UNKNOWN"))).toList();
    }

    @Transactional(readOnly = true)
    public BankTransactionResponse get(UUID merchantId, UUID id) {
        BankTransactionEntity transaction = transactionRepository.findById(id)
                .filter(value -> value.getMerchantId().equals(merchantId))
                .orElseThrow(() -> new IllegalArgumentException("Bank transaction not found"));
        String bankCode = accountRepository.findById(transaction.getBankAccountId())
                .map(BankAccountEntity::getBankCode).orElse("UNKNOWN");
        return response(transaction, bankCode);
    }

    private void match(BankTransactionEntity transaction, BankAccountEntity account) {
        List<PaymentLinkEntity> candidates = linkRepository.findByBankAccountIdAndStatusAndExpiresAtAfter(
                account.getId(), "OPEN", OffsetDateTime.now());
        String normalizedDescription = normalize(transaction.getDescription());
        List<PaymentLinkEntity> codeMatches = candidates.stream()
                .filter(link -> normalizedDescription.contains(link.getPaymentCode()))
                .filter(link -> amountMatches(link, transaction)).toList();
        List<PaymentLinkEntity> matches = codeMatches.isEmpty()
                ? candidates.stream().filter(link -> amountMatches(link, transaction)).toList() : codeMatches;
        if (matches.size() != 1) {
            transaction.setMatchStatus(matches.size() > 1 ? "REVIEW" : "UNMATCHED");
            transaction.setPaymentCode(extractCode(normalizedDescription));
            return;
        }
        PaymentLinkEntity link = matches.getFirst();
        PaymentIntentEntity intent = intentRepository.findById(link.getPaymentIntentId()).orElseThrow();
        paymentIntentService.settleFromBankTransfer(intent.getId(), transaction.getExternalReference(), account.getBankCode());
        transaction.setPaymentCode(link.getPaymentCode());
        transaction.setPaymentIntentId(intent.getId());
        transaction.setMatchStatus("MATCHED");
        transaction.setMatchedAt(OffsetDateTime.now());
        link.setStatus("PAID");
        link.setPaidAt(OffsetDateTime.now());
        linkRepository.save(link);
        eventPublisher.publishEvent(new PaymentLinkStatusChanged(link.getSlug(), link.getStatus(), link.getPaidAt()));
    }

    private boolean amountMatches(PaymentLinkEntity link, BankTransactionEntity transaction) {
        return intentRepository.findById(link.getPaymentIntentId())
                .map(intent -> intent.getAmount().equals(transaction.getAmount())
                        && intent.getCurrency().equalsIgnoreCase(transaction.getCurrency())).orElse(false);
    }

    private String extractCode(String description) {
        if (description.isBlank()) return null;
        var matcher = Pattern.compile("[A-Z]{2,5}[A-Z0-9]{4,30}").matcher(description);
        return matcher.find() ? matcher.group() : null;
    }

    private String normalize(String value) {
        return value == null ? "" : value.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
    }

    private BankTransactionResponse response(BankTransactionEntity entity, String bankCode) {
        return BankTransactionResponse.builder().id(entity.getId()).object("bank_transaction")
                .bankAccountId(entity.getBankAccountId()).bankCode(bankCode)
                .externalReference(entity.getExternalReference()).direction(entity.getDirection())
                .amount(entity.getAmount()).currency(entity.getCurrency()).description(entity.getDescription())
                .paymentCode(entity.getPaymentCode()).matchStatus(entity.getMatchStatus())
                .paymentIntentId(entity.getPaymentIntentId()).occurredAt(entity.getOccurredAt())
                .receivedAt(entity.getReceivedAt()).build();
    }

    private String writeJson(Object value) {
        try { return objectMapper.writeValueAsString(value); }
        catch (Exception exception) { throw new IllegalArgumentException("Invalid bank transaction payload", exception); }
    }

    private String sha256(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception exception) { throw new IllegalStateException("SHA-256 unavailable", exception); }
    }
}
