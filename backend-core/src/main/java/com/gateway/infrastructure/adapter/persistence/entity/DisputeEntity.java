package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "disputes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DisputeEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "charge_id", nullable = false) private UUID chargeId;
    @Column(nullable = false) private Long amount;
    @Column(nullable = false, length = 3) private String currency;
    @Column(nullable = false, length = 100) private String reason;
    @Column(nullable = false, length = 30) private String status;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private String evidence;
    @Column(name = "source_account_id", nullable = false) private UUID sourceAccountId;
    @Column(name = "due_at") private OffsetDateTime dueAt;
    @Column(name = "resolved_at") private OffsetDateTime resolvedAt;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private OffsetDateTime updatedAt;
}
