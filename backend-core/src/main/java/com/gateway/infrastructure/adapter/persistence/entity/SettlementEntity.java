package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "settlements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SettlementEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(nullable = false, length = 3) private String currency;
    @Column(name = "period_start", nullable = false) private OffsetDateTime periodStart;
    @Column(name = "period_end", nullable = false) private OffsetDateTime periodEnd;
    @Column(name = "gross_amount", nullable = false) private Long grossAmount;
    @Column(name = "fee_amount", nullable = false) private Long feeAmount;
    @Column(name = "refund_amount", nullable = false) private Long refundAmount;
    @Column(name = "net_amount", nullable = false) private Long netAmount;
    @Column(name = "charge_count", nullable = false) private Integer chargeCount;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "idempotency_key", nullable = false) private String idempotencyKey;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
    @Column(name = "finalized_at") private OffsetDateTime finalizedAt;
}
