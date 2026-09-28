package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bank_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BankTransactionEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "bank_account_id", nullable = false) private UUID bankAccountId;
    @Column(name = "external_reference", nullable = false) private String externalReference;
    @Column(nullable = false, length = 10) private String direction;
    @Column(nullable = false) private Long amount;
    @Column(nullable = false, length = 3) @Builder.Default private String currency = "VND";
    @Column(length = 500) private String description;
    @Column(name = "payment_code", length = 40) private String paymentCode;
    @Column(name = "counterparty_account") private String counterpartyAccount;
    @Column(name = "occurred_at", nullable = false) private OffsetDateTime occurredAt;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "raw_payload", nullable = false, columnDefinition = "jsonb") private String rawPayload;
    @Column(name = "payload_hash", nullable = false, length = 64) private String payloadHash;
    @Column(name = "match_status", nullable = false) @Builder.Default private String matchStatus = "RECEIVED";
    @Column(name = "payment_intent_id") private UUID paymentIntentId;
    @CreationTimestamp @Column(name = "received_at", updatable = false) private OffsetDateTime receivedAt;
    @Column(name = "matched_at") private OffsetDateTime matchedAt;
}
