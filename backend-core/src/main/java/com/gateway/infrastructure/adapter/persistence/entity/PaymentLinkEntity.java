package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_links")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentLinkEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "payment_intent_id", nullable = false, unique = true) private UUID paymentIntentId;
    @Column(name = "bank_account_id", nullable = false) private UUID bankAccountId;
    @Column(nullable = false, unique = true, length = 80) private String slug;
    @Column(name = "payment_code", nullable = false, unique = true, length = 40) private String paymentCode;
    @Column(nullable = false) @Builder.Default private String status = "OPEN";
    @Column(name = "expires_at", nullable = false) private OffsetDateTime expiresAt;
    @Column(name = "paid_at") private OffsetDateTime paidAt;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private OffsetDateTime updatedAt;
}
