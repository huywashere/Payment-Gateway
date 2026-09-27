package com.gateway.application.service;

import com.gateway.application.dto.*;
import com.gateway.infrastructure.adapter.persistence.entity.*;
import com.gateway.infrastructure.adapter.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReconciliationService {
    private final ReconciliationRunRepository runRepository;
    private final ReconciliationItemRepository itemRepository;
    private final ChargeRepository chargeRepository;
    private final OutboxService outboxService;
    private final AuditService auditService;

    @Transactional
    public ReconciliationRunResponse run(CreateReconciliationRunRequest request) {
        if (!request.getPeriodStart().isBefore(request.getPeriodEnd())) {
            throw new IllegalArgumentException("periodStart must be before periodEnd");
        }
        String processor = request.getProcessorCode().toUpperCase(Locale.ROOT);
        List<ChargeEntity> internal = chargeRepository
                .findByMerchantIdAndProcessorCodeAndCreatedAtBetweenOrderByCreatedAtAsc(
                        request.getMerchantId(), processor, request.getPeriodStart(), request.getPeriodEnd());
        Map<String, ReconciliationRecordRequest> external = new LinkedHashMap<>();
        for (ReconciliationRecordRequest record : request.getRecords()) {
            if (external.putIfAbsent(record.getProcessorTxId(), record) != null) {
                throw new IllegalArgumentException("Duplicate processorTxId in reconciliation input: " + record.getProcessorTxId());
            }
        }
        Map<String, ChargeEntity> internalByReference = internal.stream()
                .filter(charge -> charge.getProcessorTxId() != null)
                .collect(Collectors.toMap(ChargeEntity::getProcessorTxId, Function.identity(), (first, ignored) -> first));
        ReconciliationRunEntity run = runRepository.save(ReconciliationRunEntity.builder()
                .merchantId(request.getMerchantId()).processorCode(processor).periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd()).status("RUNNING").matchedCount(0).mismatchCount(0)
                .externalCount(external.size()).internalCount(internal.size()).build());
        int matched = 0;
        int mismatched = 0;
        Set<String> seen = new HashSet<>();
        for (ReconciliationRecordRequest record : external.values()) {
            ChargeEntity charge = internalByReference.get(record.getProcessorTxId());
            ReconciliationItemEntity item;
            if (charge == null) {
                item = item(run.getId(), null, record.getProcessorTxId(), "MISSING_INTERNAL",
                        null, record.getAmount(), null, record.getStatus(), "Processor record has no internal charge");
                mismatched++;
            } else {
                seen.add(record.getProcessorTxId());
                boolean amountMatches = Objects.equals(charge.getAmount(), record.getAmount());
                boolean statusMatches = charge.getStatus().equalsIgnoreCase(record.getStatus());
                String result = amountMatches && statusMatches ? "MATCHED"
                        : !amountMatches ? "AMOUNT_MISMATCH" : "STATUS_MISMATCH";
                item = item(run.getId(), charge.getId(), record.getProcessorTxId(), result,
                        charge.getAmount(), record.getAmount(), charge.getStatus(), record.getStatus(),
                        "MATCHED".equals(result) ? null : "Internal and processor values differ");
                if ("MATCHED".equals(result)) matched++; else mismatched++;
            }
            itemRepository.save(item);
        }
        for (ChargeEntity charge : internal) {
            if (charge.getProcessorTxId() != null && !seen.contains(charge.getProcessorTxId())) {
                itemRepository.save(item(run.getId(), charge.getId(), charge.getProcessorTxId(), "MISSING_PROCESSOR",
                        charge.getAmount(), null, charge.getStatus(), null, "Internal charge is absent from processor report"));
                mismatched++;
            }
        }
        run.setMatchedCount(matched);
        run.setMismatchCount(mismatched);
        run.setStatus(mismatched == 0 ? "MATCHED" : "REQUIRES_REVIEW");
        run.setCompletedAt(OffsetDateTime.now());
        runRepository.save(run);
        outboxService.enqueue(run.getMerchantId(), "RECONCILIATION_RUN", run.getId(), "reconciliation.completed", Map.of(
                "id", run.getId().toString(), "status", run.getStatus(), "matched", matched, "mismatched", mismatched));
        auditService.record(run.getMerchantId(), "PLATFORM_ADMIN", "platform", "reconciliation.completed",
                "reconciliation_run", run.getId().toString(), Map.of("status", run.getStatus(), "mismatched", mismatched));
        return response(run, true);
    }

    @Transactional(readOnly = true)
    public List<ReconciliationRunResponse> list(UUID merchantId, int limit) {
        return runRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId,
                PageRequest.of(0, Math.max(1, Math.min(limit, 100)))).stream()
                .map(run -> response(run, false)).toList();
    }

    @Transactional(readOnly = true)
    public ReconciliationRunResponse get(UUID merchantId, UUID id) {
        ReconciliationRunEntity run = runRepository.findById(id)
                .filter(value -> value.getMerchantId().equals(merchantId))
                .orElseThrow(() -> new IllegalArgumentException("Reconciliation run not found"));
        return response(run, true);
    }

    private ReconciliationItemEntity item(UUID runId, UUID chargeId, String tx, String result,
                                          Long internalAmount, Long externalAmount, String internalStatus,
                                          String externalStatus, String details) {
        return ReconciliationItemEntity.builder().runId(runId).chargeId(chargeId).processorTxId(tx).result(result)
                .internalAmount(internalAmount).externalAmount(externalAmount).internalStatus(internalStatus)
                .externalStatus(externalStatus).details(details).build();
    }

    private ReconciliationRunResponse response(ReconciliationRunEntity run, boolean includeItems) {
        List<ReconciliationItemResponse> items = includeItems ? itemRepository.findByRunIdOrderByCreatedAtAsc(run.getId())
                .stream().map(item -> ReconciliationItemResponse.builder().id(item.getId()).chargeId(item.getChargeId())
                        .processorTxId(item.getProcessorTxId()).result(item.getResult())
                        .internalAmount(item.getInternalAmount()).externalAmount(item.getExternalAmount())
                        .internalStatus(item.getInternalStatus()).externalStatus(item.getExternalStatus())
                        .details(item.getDetails()).build()).toList() : null;
        return ReconciliationRunResponse.builder().id(run.getId()).object("reconciliation_run")
                .merchantId(run.getMerchantId()).processorCode(run.getProcessorCode()).status(run.getStatus())
                .matchedCount(run.getMatchedCount()).mismatchCount(run.getMismatchCount())
                .externalCount(run.getExternalCount()).internalCount(run.getInternalCount())
                .periodStart(run.getPeriodStart()).periodEnd(run.getPeriodEnd()).createdAt(run.getCreatedAt())
                .completedAt(run.getCompletedAt()).items(items).build();
    }
}
