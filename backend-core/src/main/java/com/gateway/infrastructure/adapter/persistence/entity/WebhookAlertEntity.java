package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "webhook_alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WebhookAlertEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;
    @Column(name = "endpoint_id", nullable = false)
    private UUID endpointId;
    @Column(name = "delivery_id")
    private UUID deliveryId;
    @Column(nullable = false, length = 30)
    private String channel;
    @Column(nullable = false, length = 500)
    private String destination;
    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING";
    @Column(nullable = false, length = 1000)
    private String message;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
    @Column(name = "sent_at")
    private OffsetDateTime sentAt;
}
