package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "portal_notifications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PortalNotificationEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(nullable = false, length = 40) private String type;
    @Column(nullable = false, length = 20) @Builder.Default private String severity = "INFO";
    @Column(nullable = false) private String title;
    @Column(nullable = false, length = 1000) private String message;
    @Column(name = "resource_type") private String resourceType;
    @Column(name = "resource_id") private String resourceId;
    @Column(name = "read_at") private OffsetDateTime readAt;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
}
