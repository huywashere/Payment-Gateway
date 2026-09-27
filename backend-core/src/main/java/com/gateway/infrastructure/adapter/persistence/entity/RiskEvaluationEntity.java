package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "risk_evaluations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RiskEvaluationEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "payment_intent_id", nullable = false) private UUID paymentIntentId;
    @Column(nullable = false, length = 20) private String decision;
    @Column(nullable = false) private Integer score;
    @JdbcTypeCode(SqlTypes.JSON) @Column(nullable = false, columnDefinition = "jsonb") private String reasons;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
}
