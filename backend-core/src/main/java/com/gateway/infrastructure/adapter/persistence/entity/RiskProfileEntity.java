package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "risk_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RiskProfileEntity {
    @Id
    @Column(name = "merchant_id")
    private UUID merchantId;
    @Column(nullable = false) @Builder.Default private Boolean enabled = true;
    @Column(name = "max_transaction_amount", nullable = false) @Builder.Default private Long maxTransactionAmount = 50_000_000L;
    @Column(name = "daily_volume_limit", nullable = false) @Builder.Default private Long dailyVolumeLimit = 500_000_000L;
    @Column(name = "velocity_limit_per_minute", nullable = false) @Builder.Default private Integer velocityLimitPerMinute = 20;
    @Column(name = "review_score_threshold", nullable = false) @Builder.Default private Integer reviewScoreThreshold = 50;
    @Column(name = "block_score_threshold", nullable = false) @Builder.Default private Integer blockScoreThreshold = 80;
    @Column(name = "blocked_email_domains", nullable = false) @Builder.Default private String blockedEmailDomains = "";
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private OffsetDateTime updatedAt;
}
