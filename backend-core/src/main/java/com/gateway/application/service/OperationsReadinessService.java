package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OperationsReadinessService {
    private final OutboxEventRepository outboxRepository;
    private final WebhookDeliveryRepository webhookRepository;
    private final DisputeRepository disputeRepository;
    private final ReconciliationRunRepository reconciliationRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> snapshot() {
        long failedOutbox = outboxRepository.countByStatus("FAILED");
        long failedWebhooks = webhookRepository.countByStatus("FAILED");
        long openDisputes = disputeRepository.countByStatusIn(List.of("NEEDS_RESPONSE", "UNDER_REVIEW"));
        long reconciliationReviews = reconciliationRepository.countByStatus("REQUIRES_REVIEW");
        String status = failedOutbox == 0 ? "READY" : "ACTION_REQUIRED";
        return Map.of(
                "object", "operations_readiness",
                "status", status,
                "failed_outbox_events", failedOutbox,
                "failed_webhook_deliveries", failedWebhooks,
                "open_disputes", openDisputes,
                "reconciliation_runs_requiring_review", reconciliationReviews,
                "checked_at", OffsetDateTime.now().toString()
        );
    }
}
