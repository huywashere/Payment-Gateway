package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "webhook_endpoints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookEndpointEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;
    @Column(nullable = false, length = 500)
    private String url;
    private String description;
    @Column(name = "signing_secret", nullable = false)
    private String signingSecret;
    @Column(name = "subscribed_events", nullable = false)
    @Builder.Default
    private String subscribedEvents = "*";
    @Column(nullable = false)
    @Builder.Default
    private String status = "ACTIVE";
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}

