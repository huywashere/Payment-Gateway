package com.gateway.application.service;

import com.gateway.application.dto.CreateRefundRequest;
import com.gateway.application.dto.RefundResponse;
import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import com.gateway.infrastructure.adapter.persistence.entity.RefundEntity;
import com.gateway.infrastructure.adapter.persistence.repository.ChargeRepository;
import com.gateway.infrastructure.adapter.persistence.repository.RefundRepository;
import com.gateway.infrastructure.adapter.redis.IdempotencyManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefundService {
    private final ChargeRepository chargeRepository;
    private final RefundRepository refundRepository;
    private final LedgerService ledgerService;
    private final OutboxService outboxService;
    private final IdempotencyManager idempotencyManager;
    private final AuditService auditService;

    @Transactional
    public RefundResponse create(UUID merchantId, UUID chargeId, String idempotencyKey, CreateRefundRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency-Key is required when creating a refund");
        }
        String fingerprint = idempotencyManager.fingerprint(Map.of("chargeId", chargeId, "request", request));
        return idempotencyManager.execute(merchantId, "refund:" + idempotencyKey, fingerprint,
                RefundResponse.class, () -> executeCreate(merchantId, chargeId, idempotencyKey, request));
    }

    private RefundResponse executeCreate(UUID merchantId, UUID chargeId, String idempotencyKey, CreateRefundRequest request) {
        RefundEntity existing = refundRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey).orElse(null);
        if (existing != null) return response(existing);
        ChargeEntity charge = chargeRepository.findOwnedForUpdate(chargeId, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Charge not found"));
        if (!"SUCCEEDED".equals(charge.getStatus()) && !"PARTIALLY_REFUNDED".equals(charge.getStatus())) {
            throw new IllegalStateException("Only succeeded charges can be refunded");
        }
        long alreadyRefunded = refundRepository.totalSucceededForCharge(chargeId);
        long refundable = charge.getAmount() - alreadyRefunded;
        long amount = request.getAmount() == null ? refundable : request.getAmount();
        if (amount <= 0 || amount > refundable) {
            throw new IllegalArgumentException("Refund amount exceeds the remaining refundable amount: " + refundable);
        }
        RefundEntity refund = refundRepository.save(RefundEntity.builder()
                .chargeId(chargeId).merchantId(merchantId).amount(amount).currency(charge.getCurrency())
                .status("SUCCEEDED").reason(request.getReason()).idempotencyKey(idempotencyKey)
                .processorRefundId("re_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20)).build());
        ledgerService.recordRefundSucceeded(charge, refund);
        charge.setStatus(amount == refundable ? "REFUNDED" : "PARTIALLY_REFUNDED");
        chargeRepository.save(charge);
        outboxService.enqueue(merchantId, "REFUND", refund.getId(), "refund.succeeded", Map.of(
                "id", refund.getId().toString(), "object", "refund", "charge", chargeId.toString(),
                "amount", amount, "currency", charge.getCurrency(), "status", "succeeded"));
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "refund.created",
                "refund", refund.getId().toString(), Map.of("charge_id", chargeId, "amount", amount));
        return response(refund);
    }

    private RefundResponse response(RefundEntity entity) {
        return RefundResponse.builder().id(entity.getId()).object("refund").chargeId(entity.getChargeId())
                .amount(entity.getAmount()).currency(entity.getCurrency()).status(entity.getStatus())
                .reason(entity.getReason()).createdAt(entity.getCreatedAt()).build();
    }
}
