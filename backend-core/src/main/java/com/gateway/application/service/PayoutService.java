package com.gateway.application.service;

import com.gateway.application.dto.CreatePayoutRequest;
import com.gateway.application.dto.PayoutResponse;
import com.gateway.infrastructure.adapter.persistence.entity.PayoutEntity;
import com.gateway.infrastructure.adapter.persistence.repository.PayoutRepository;
import com.gateway.infrastructure.adapter.redis.IdempotencyManager;
import com.gateway.infrastructure.adapter.processor.PayoutProcessor;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.micrometer.core.instrument.MeterRegistry;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PayoutService {
    private final PayoutRepository repository;
    private final LedgerService ledgerService;
    private final OutboxService outboxService;
    private final AuditService auditService;
    private final IdempotencyManager idempotencyManager;
    private final PayoutProcessor payoutProcessor;
    private final MeterRegistry meterRegistry;

    @Transactional
    public PayoutResponse create(UUID merchantId, String idempotencyKey, CreatePayoutRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) throw new IllegalArgumentException("Idempotency-Key is required");
        return idempotencyManager.execute(merchantId, "payout:" + idempotencyKey,
                idempotencyManager.fingerprint(request), PayoutResponse.class,
                () -> executeCreate(merchantId, idempotencyKey, request));
    }

    private PayoutResponse executeCreate(UUID merchantId, String idempotencyKey, CreatePayoutRequest request) {
        PayoutEntity existing = repository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey).orElse(null);
        if (existing != null) return response(existing);
        long available = ledgerService.getMerchantAvailableBalance(merchantId);
        if (request.getAmount() > available) {
            throw new IllegalStateException("Payout amount exceeds available balance: " + available);
        }
        String destination = request.getDestinationReference().trim();
        if (destination.length() > 100) throw new IllegalArgumentException("Destination reference is too long");
        PayoutEntity payout = repository.save(PayoutEntity.builder().merchantId(merchantId)
                .amount(request.getAmount()).currency(request.getCurrency().toUpperCase(Locale.ROOT))
                .status("PROCESSING").destinationReference(mask(destination)).description(request.getDescription())
                .idempotencyKey(idempotencyKey).build());
        PayoutProcessor.PayoutProcessResponse result = payoutProcessor.createPayout(
                PayoutProcessor.PayoutProcessRequest.builder()
                        .operationId(merchantId + ":payout:" + idempotencyKey)
                        .amount(payout.getAmount()).currency(payout.getCurrency())
                        .destinationReference(destination).description(payout.getDescription()).build());
        if (!result.isSuccess()) {
            meterRegistry.counter("gateway_payout_outcomes_total", "outcome", "failed").increment();
            payout.setStatus("FAILED");
            payout.setFailureMessage(result.getErrorMessage());
            repository.save(payout);
            outboxService.enqueue(merchantId, "PAYOUT", payout.getId(), "payout.failed", Map.of(
                    "id", payout.getId().toString(), "amount", payout.getAmount(), "currency", payout.getCurrency(),
                    "status", payout.getStatus(), "failure_code", result.getErrorCode()));
            auditService.record(merchantId, "API_KEY", merchantId.toString(), "payout.failed",
                    "payout", payout.getId().toString(), Map.of("failure_code", result.getErrorCode()));
            return response(payout);
        }
        payout.setStatus("PAID");
        meterRegistry.counter("gateway_payout_outcomes_total", "outcome", "paid").increment();
        payout.setProcessorPayoutId(result.getProcessorPayoutId());
        payout.setPaidAt(OffsetDateTime.now());
        repository.save(payout);
        ledgerService.recordPayout(payout);
        outboxService.enqueue(merchantId, "PAYOUT", payout.getId(), "payout.paid", Map.of(
                "id", payout.getId().toString(), "amount", payout.getAmount(), "currency", payout.getCurrency(),
                "status", payout.getStatus()));
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "payout.created",
                "payout", payout.getId().toString(), Map.of("amount", payout.getAmount()));
        return response(payout);
    }

    @Transactional(readOnly = true)
    public List<PayoutResponse> list(UUID merchantId, int limit) {
        return repository.findByMerchantIdOrderByCreatedAtDesc(merchantId,
                PageRequest.of(0, Math.max(1, Math.min(limit, 100)))).stream().map(this::response).toList();
    }

    private String mask(String value) {
        if (value.length() <= 4) return "****" + value;
        return "****" + value.substring(value.length() - 4);
    }

    private PayoutResponse response(PayoutEntity entity) {
        return PayoutResponse.builder().id(entity.getId()).object("payout").amount(entity.getAmount())
                .currency(entity.getCurrency()).status(entity.getStatus()).destinationReference(entity.getDestinationReference())
                .description(entity.getDescription()).processorPayoutId(entity.getProcessorPayoutId())
                .createdAt(entity.getCreatedAt()).paidAt(entity.getPaidAt()).build();
    }
}
