package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "merchant_subscriptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MerchantSubscriptionEntity {
    @Id @Column(name = "merchant_id") private UUID merchantId;
    @Column(name = "plan_code", nullable = false) private String planCode;
    @Column(nullable = false) private String status;
    @Column(name = "current_period_start", nullable = false) private OffsetDateTime currentPeriodStart;
    @Column(name = "current_period_end", nullable = false) private OffsetDateTime currentPeriodEnd;
    @Column(name = "cancel_at_period_end", nullable = false) private boolean cancelAtPeriodEnd;
    @UpdateTimestamp @Column(name = "updated_at") private OffsetDateTime updatedAt;
}
