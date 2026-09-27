package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payouts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PayoutEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "settlement_id") private UUID settlementId;
    @Column(nullable = false) private Long amount;
    @Column(nullable = false, length = 3) private String currency;
    @Column(nullable = false, length = 30) private String status;
    @Column(name = "destination_reference", nullable = false, length = 100) private String destinationReference;
    @Column(length = 255) private String description;
    @Column(name = "processor_payout_id") private String processorPayoutId;
    @Column(name = "idempotency_key", nullable = false) private String idempotencyKey;
    @Column(name = "failure_message", columnDefinition = "TEXT") private String failureMessage;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
    @Column(name = "paid_at") private OffsetDateTime paidAt;
}
