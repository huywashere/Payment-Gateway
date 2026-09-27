package com.gateway.application.service;

import com.gateway.application.dto.CreateSettlementRequest;
import com.gateway.application.dto.SettlementResponse;
import com.gateway.infrastructure.adapter.persistence.entity.*;
import com.gateway.infrastructure.adapter.persistence.repository.*;
import com.gateway.infrastructure.adapter.redis.IdempotencyManager;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SettlementService {
    private final SettlementRepository settlementRepository;
    private final SettlementItemRepository itemRepository;
    private final ChargeRepository chargeRepository;
    private final RefundRepository refundRepository;
    private final LedgerService ledgerService;
    private final OutboxService outboxService;
    private final AuditService auditService;
    private final IdempotencyManager idempotencyManager;

    @Transactional
    public SettlementResponse create(UUID merchantId, String idempotencyKey, CreateSettlementRequest request) {
        requireKey(idempotencyKey);
        String fingerprint = idempotencyManager.fingerprint(request);
        return idempotencyManager.execute(merchantId, "settlement:" + idempotencyKey, fingerprint,
                SettlementResponse.class, () -> executeCreate(merchantId, idempotencyKey, request));
    }

    private SettlementResponse executeCreate(UUID merchantId, String idempotencyKey, CreateSettlementRequest request) {
        SettlementEntity existing = settlementRepository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey).orElse(null);
        if (existing != null) return response(existing);
        OffsetDateTime cutoff = request.getCutoff() == null ? OffsetDateTime.now() : request.getCutoff();
        String currency = request.getCurrency() == null ? "VND" : request.getCurrency().toUpperCase(Locale.ROOT);
        List<ChargeEntity> candidates = chargeRepository
                .findEligibleForSettlement(
                        merchantId, List.of("SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"), cutoff).stream()
                .filter(charge -> currency.equals(charge.getCurrency()))
                .filter(charge -> !itemRepository.existsByChargeId(charge.getId()))
                .toList();
        if (candidates.isEmpty()) throw new IllegalStateException("No unsettled charges are eligible before the cutoff");

        long gross = candidates.stream().mapToLong(ChargeEntity::getAmount).sum();
        long fees = candidates.stream().mapToLong(ChargeEntity::getFeeAmount).sum();
        long refunds = candidates.stream().mapToLong(charge -> refundRepository.totalSucceededForCharge(charge.getId())).sum();
        long net = Math.max(0L, gross - fees - refunds);
        SettlementEntity settlement = settlementRepository.save(SettlementEntity.builder()
                .merchantId(merchantId).currency(currency).periodStart(candidates.get(0).getCreatedAt())
                .periodEnd(cutoff).grossAmount(gross).feeAmount(fees).refundAmount(refunds).netAmount(net)
                .chargeCount(candidates.size()).status("FINALIZED").idempotencyKey(idempotencyKey)
                .finalizedAt(OffsetDateTime.now()).build());
        for (ChargeEntity charge : candidates) {
            long chargeRefunds = refundRepository.totalSucceededForCharge(charge.getId());
            itemRepository.save(SettlementItemEntity.builder().settlementId(settlement.getId()).chargeId(charge.getId())
                    .grossAmount(charge.getAmount()).feeAmount(charge.getFeeAmount()).refundAmount(chargeRefunds)
                    .netAmount(Math.max(0L, charge.getAmount() - charge.getFeeAmount() - chargeRefunds)).build());
        }
        ledgerService.recordSettlement(settlement);
        outboxService.enqueue(merchantId, "SETTLEMENT", settlement.getId(), "settlement.finalized", Map.of(
                "id", settlement.getId().toString(), "gross_amount", gross, "fee_amount", fees,
                "refund_amount", refunds, "net_amount", net, "currency", currency));
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "settlement.finalized",
                "settlement", settlement.getId().toString(), Map.of("net_amount", net, "charge_count", candidates.size()));
        return response(settlement);
    }

    @Transactional(readOnly = true)
    public List<SettlementResponse> list(UUID merchantId, int limit) {
        return settlementRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId,
                PageRequest.of(0, Math.max(1, Math.min(limit, 100)))).stream().map(this::response).toList();
    }

    private SettlementResponse response(SettlementEntity entity) {
        return SettlementResponse.builder().id(entity.getId()).object("settlement").status(entity.getStatus())
                .currency(entity.getCurrency()).grossAmount(entity.getGrossAmount()).feeAmount(entity.getFeeAmount())
                .refundAmount(entity.getRefundAmount()).netAmount(entity.getNetAmount()).chargeCount(entity.getChargeCount())
                .periodStart(entity.getPeriodStart()).periodEnd(entity.getPeriodEnd()).createdAt(entity.getCreatedAt())
                .finalizedAt(entity.getFinalizedAt()).build();
    }

    private void requireKey(String key) {
        if (key == null || key.isBlank()) throw new IllegalArgumentException("Idempotency-Key is required");
    }
}
