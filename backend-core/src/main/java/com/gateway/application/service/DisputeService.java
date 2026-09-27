package com.gateway.application.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.*;
import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import com.gateway.infrastructure.adapter.persistence.entity.DisputeEntity;
import com.gateway.infrastructure.adapter.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DisputeService {
    private final DisputeRepository repository;
    private final ChargeRepository chargeRepository;
    private final SettlementItemRepository settlementItemRepository;
    private final LedgerService ledgerService;
    private final OutboxService outboxService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional
    public DisputeResponse create(CreateDisputeRequest request) {
        ChargeEntity charge = chargeRepository.findByIdAndMerchantId(request.getChargeId(), request.getMerchantId())
                .orElseThrow(() -> new IllegalArgumentException("Charge not found for merchant"));
        if (!settlementItemRepository.existsByChargeId(charge.getId())) {
            throw new IllegalStateException("Charge must be settled before a dispute can reserve funds");
        }
        if (request.getAmount() > charge.getAmount()) throw new IllegalArgumentException("Dispute amount exceeds charge amount");
        if (request.getAmount() > ledgerService.getMerchantAvailableBalance(request.getMerchantId())) {
            throw new IllegalStateException("Merchant available balance cannot cover the dispute reserve");
        }
        UUID sourceAccountId = ledgerService.getOrCreateAvailableAccountId(request.getMerchantId(), charge.getCurrency());
        DisputeEntity dispute = repository.save(DisputeEntity.builder().merchantId(request.getMerchantId())
                .chargeId(charge.getId()).amount(request.getAmount()).currency(charge.getCurrency())
                .reason(request.getReason().trim()).status("NEEDS_RESPONSE").sourceAccountId(sourceAccountId)
                .dueAt(request.getDueAt() == null ? OffsetDateTime.now().plusDays(7) : request.getDueAt()).build());
        ledgerService.recordDisputeOpened(dispute);
        outboxService.enqueue(dispute.getMerchantId(), "DISPUTE", dispute.getId(), "dispute.created", Map.of(
                "id", dispute.getId().toString(), "charge", dispute.getChargeId().toString(),
                "amount", dispute.getAmount(), "reason", dispute.getReason(), "status", dispute.getStatus()));
        auditService.record(dispute.getMerchantId(), "PLATFORM_ADMIN", "platform", "dispute.created",
                "dispute", dispute.getId().toString(), Map.of("amount", dispute.getAmount()));
        return response(dispute);
    }

    @Transactional
    public DisputeResponse submitEvidence(UUID merchantId, UUID disputeId, SubmitDisputeEvidenceRequest request) {
        DisputeEntity dispute = owned(merchantId, disputeId);
        if (!Set.of("NEEDS_RESPONSE", "UNDER_REVIEW").contains(dispute.getStatus())) {
            throw new IllegalStateException("Evidence cannot be submitted for a resolved dispute");
        }
        dispute.setEvidence(writeJson(request.getEvidence()));
        dispute.setStatus("UNDER_REVIEW");
        repository.save(dispute);
        outboxService.enqueue(merchantId, "DISPUTE", dispute.getId(), "dispute.evidence_submitted",
                Map.of("id", dispute.getId().toString(), "status", dispute.getStatus()));
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "dispute.evidence_submitted",
                "dispute", dispute.getId().toString(), null);
        return response(dispute);
    }

    @Transactional
    public DisputeResponse resolve(UUID disputeId, ResolveDisputeRequest request) {
        DisputeEntity dispute = repository.findById(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("Dispute not found"));
        if (Set.of("WON", "LOST").contains(dispute.getStatus())) throw new IllegalStateException("Dispute is already resolved");
        String outcome = request.getOutcome().toUpperCase(Locale.ROOT);
        if (!Set.of("WON", "LOST").contains(outcome)) throw new IllegalArgumentException("Outcome must be WON or LOST");
        ledgerService.recordDisputeResolution(dispute, "WON".equals(outcome));
        dispute.setStatus(outcome);
        dispute.setResolvedAt(OffsetDateTime.now());
        repository.save(dispute);
        outboxService.enqueue(dispute.getMerchantId(), "DISPUTE", dispute.getId(), "dispute.closed", Map.of(
                "id", dispute.getId().toString(), "status", outcome, "amount", dispute.getAmount()));
        auditService.record(dispute.getMerchantId(), "PLATFORM_ADMIN", "platform", "dispute.resolved",
                "dispute", dispute.getId().toString(), Map.of("outcome", outcome));
        return response(dispute);
    }

    @Transactional(readOnly = true)
    public List<DisputeResponse> list(UUID merchantId, int limit) {
        return repository.findByMerchantIdOrderByCreatedAtDesc(merchantId,
                PageRequest.of(0, Math.max(1, Math.min(limit, 100)))).stream().map(this::response).toList();
    }

    private DisputeEntity owned(UUID merchantId, UUID id) {
        return repository.findByIdAndMerchantId(id, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Dispute not found"));
    }

    private String writeJson(Object value) {
        try { return objectMapper.writeValueAsString(value); }
        catch (Exception e) { throw new IllegalArgumentException("Evidence is not serializable", e); }
    }

    private Map<String, Object> readEvidence(String value) {
        if (value == null) return null;
        try { return objectMapper.readValue(value, new TypeReference<>() {}); }
        catch (Exception e) { return Map.of("unreadable", true); }
    }

    private DisputeResponse response(DisputeEntity entity) {
        return DisputeResponse.builder().id(entity.getId()).object("dispute").chargeId(entity.getChargeId())
                .amount(entity.getAmount()).currency(entity.getCurrency()).reason(entity.getReason())
                .status(entity.getStatus()).evidence(readEvidence(entity.getEvidence())).dueAt(entity.getDueAt())
                .createdAt(entity.getCreatedAt()).resolvedAt(entity.getResolvedAt()).build();
    }
}
