package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "charges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChargeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "payment_intent_id", nullable = false)
    private UUID paymentIntentId;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Column(name = "fee_amount", nullable = false)
    @Builder.Default
    private Long feeAmount = 0L;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "VND";

    @Column(name = "processor_tx_id")
    private String processorTxId;

    @Column(name = "processor_code", nullable = false, length = 50)
    private String processorCode; // MOCK_BANK, VIETQR

    @Column(name = "status", nullable = false, length = 50)
    private String status; // SUCCEEDED, FAILED, PENDING

    @Column(name = "failure_message", columnDefinition = "TEXT")
    private String failureMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
