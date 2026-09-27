package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "settlement_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SettlementItemEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "settlement_id", nullable = false) private UUID settlementId;
    @Column(name = "charge_id", nullable = false, unique = true) private UUID chargeId;
    @Column(name = "gross_amount", nullable = false) private Long grossAmount;
    @Column(name = "fee_amount", nullable = false) private Long feeAmount;
    @Column(name = "refund_amount", nullable = false) private Long refundAmount;
    @Column(name = "net_amount", nullable = false) private Long netAmount;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
}
