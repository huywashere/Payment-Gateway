package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "acquirer_operations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcquirerOperationEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "payment_intent_id") private UUID paymentIntentId;
    @Column(name = "parent_operation_id") private UUID parentOperationId;
    @Column(name = "operation_type", nullable = false) private String operationType;
    @Column(name = "idempotency_key", nullable = false) private String idempotencyKey;
    @Column(name = "processor_code", nullable = false) private String processorCode;
    @Column(name = "processor_reference", nullable = false) private String processorReference;
    @Column(nullable = false) private Long amount;
    @Column(nullable = false, length = 3) private String currency;
    @Column(nullable = false) private String status;
    @Column(name = "three_ds_version") private String threeDsVersion;
    @Column(name = "action_url") private String actionUrl;
    @Column(name = "failure_code") private String failureCode;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private OffsetDateTime updatedAt;
}
