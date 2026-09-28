package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "subscription_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubscriptionEventEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "previous_plan") private String previousPlan;
    @Column(name = "new_plan", nullable = false) private String newPlan;
    @Column(nullable = false) private String reason;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
}
