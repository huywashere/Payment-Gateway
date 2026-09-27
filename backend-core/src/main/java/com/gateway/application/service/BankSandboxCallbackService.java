package com.gateway.application.service;

import com.gateway.application.dto.BankSandboxCallbackRequest;
import com.gateway.domain.model.payment.PaymentIntentStatus;
import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.repository.ChargeRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import com.gateway.infrastructure.adapter.security.HmacSigner;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BankSandboxCallbackService {
    private final HmacSigner signer;
    private final JdbcTemplate jdbc;
    private final ChargeRepository chargeRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final LedgerService ledgerService;
    private final OutboxService outboxService;

    @Value("${gateway.processor.sandbox-callback-secret}")
    private String callbackSecret;

    @Transactional
    public Map<String, Object> accept(BankSandboxCallbackRequest request,
                                      String rawPayload, String signature) {
        if (signature == null || !signer.verifySignature(rawPayload, signature, callbackSecret, 300)) {
            throw new IllegalArgumentException("Invalid or expired sandbox bank callback signature");
        }
        String payloadHash = sha256(rawPayload);
        int inserted = jdbc.update("""
                INSERT INTO processor_callbacks(event_id, processor_tx_id, payload_hash, processing_status)
                VALUES (?, ?, ?, 'RECEIVED') ON CONFLICT (event_id) DO NOTHING
                """, request.getEventId(), request.getProcessorTransactionId(), payloadHash);
        boolean redelivery = inserted == 0;
        if (inserted == 0) {
            Map<String, Object> stored = jdbc.queryForMap(
                    "SELECT payload_hash, processing_status FROM processor_callbacks WHERE event_id = ?",
                    request.getEventId());
            String storedHash = String.valueOf(stored.get("payload_hash"));
            if (!MessageDigest.isEqual(payloadHash.getBytes(StandardCharsets.UTF_8),
                    storedHash.getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Callback event ID was reused with a different payload");
            }
            if (!"UNMATCHED".equals(String.valueOf(stored.get("processing_status")))) {
                return response(request, true, "duplicate");
            }
        }

        ChargeEntity charge = chargeRepository.findByProcessorTxIdForUpdate(request.getProcessorTransactionId())
                .orElse(null);
        if (charge == null) {
            mark(request.getEventId(), "UNMATCHED");
            return response(request, false, "unmatched");
        }
        if (!charge.getAmount().equals(request.getAmount())
                || !charge.getCurrency().equalsIgnoreCase(request.getCurrency())) {
            throw new IllegalArgumentException("Callback amount or currency does not match the charge");
        }
        PaymentIntentEntity intent = paymentIntentRepository.findById(charge.getPaymentIntentId())
                .orElseThrow(() -> new IllegalStateException("Callback payment intent is missing"));
        String callbackStatus = request.getStatus().toUpperCase(Locale.ROOT);
        if ("SUCCEEDED".equals(callbackStatus) && "PENDING".equals(charge.getStatus())) {
            charge.setStatus("SUCCEEDED");
            intent.setStatus(PaymentIntentStatus.SUCCEEDED);
            chargeRepository.save(charge);
            paymentIntentRepository.save(intent);
            ledgerService.recordPaymentSucceeded(charge);
            outboxService.enqueue(charge.getMerchantId(), "PAYMENT_INTENT", intent.getId(),
                    "payment_intent.succeeded", Map.of("id", intent.getId().toString(),
                            "merchant_id", intent.getMerchantId().toString(), "status", "succeeded"));
        } else if ("FAILED".equals(callbackStatus) && "PENDING".equals(charge.getStatus())) {
            charge.setStatus("FAILED");
            intent.setStatus(PaymentIntentStatus.FAILED);
            intent.setLastErrorCode("bank_callback_failed");
            chargeRepository.save(charge);
            paymentIntentRepository.save(intent);
            outboxService.enqueue(charge.getMerchantId(), "PAYMENT_INTENT", intent.getId(),
                    "payment_intent.payment_failed", Map.of("id", intent.getId().toString(),
                            "merchant_id", intent.getMerchantId().toString(), "status", "failed"));
        } else if (!"SUCCEEDED".equals(callbackStatus) && !"FAILED".equals(callbackStatus)) {
            throw new IllegalArgumentException("Unsupported bank callback status");
        }
        mark(request.getEventId(), "PROCESSED");
        return response(request, redelivery, "processed");
    }

    private void mark(String eventId, String status) {
        jdbc.update("UPDATE processor_callbacks SET processing_status = ?, processed_at = ? WHERE event_id = ?",
                status, OffsetDateTime.now(), eventId);
    }

    private Map<String, Object> response(BankSandboxCallbackRequest request, boolean duplicate, String outcome) {
        return Map.of(
                "accepted", true,
                "duplicate", duplicate,
                "outcome", outcome,
                "event_id", request.getEventId(),
                "processor_transaction_id", request.getProcessorTransactionId()
        );
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
