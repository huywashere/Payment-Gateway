package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "reconciliation_runs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReconciliationRunEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "processor_code", nullable = false, length = 50) private String processorCode;
    @Column(name = "period_start", nullable = false) private OffsetDateTime periodStart;
    @Column(name = "period_end", nullable = false) private OffsetDateTime periodEnd;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "matched_count", nullable = false) private Integer matchedCount;
    @Column(name = "mismatch_count", nullable = false) private Integer mismatchCount;
    @Column(name = "external_count", nullable = false) private Integer externalCount;
    @Column(name = "internal_count", nullable = false) private Integer internalCount;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
    @Column(name = "completed_at") private OffsetDateTime completedAt;
}
