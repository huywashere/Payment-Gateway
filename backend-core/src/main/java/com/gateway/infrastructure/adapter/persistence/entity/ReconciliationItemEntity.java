package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "reconciliation_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReconciliationItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "run_id", nullable = false) private UUID runId;
    @Column(name = "charge_id") private UUID chargeId;
    @Column(name = "processor_tx_id") private String processorTxId;
    @Column(nullable = false, length = 40) private String result;
    @Column(name = "internal_amount") private Long internalAmount;
    @Column(name = "external_amount") private Long externalAmount;
    @Column(name = "internal_status", length = 50) private String internalStatus;
    @Column(name = "external_status", length = 50) private String externalStatus;
    @Column(length = 500) private String details;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
}
