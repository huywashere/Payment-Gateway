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
    @Column(name = "auth_type", nullable = false, length = 30)
    @Builder.Default
    private String authType = "HMAC_SHA256";
    @Column(name = "auth_config_encrypted", columnDefinition = "TEXT")
    private String authConfigEncrypted;
    @Column(name = "previous_signing_secret")
    private String previousSigningSecret;
    @Column(name = "previous_secret_valid_until")
    private OffsetDateTime previousSecretValidUntil;
    @Column(name = "bank_code_filter", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String bankCodeFilter = "*";
    @Column(name = "account_id_filter", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String accountIdFilter = "*";
    @Column(name = "direction_filter", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String directionFilter = "*";
    @Column(name = "payment_code_prefix_filter", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String paymentCodePrefixFilter = "*";
    @Column(name = "consecutive_failures", nullable = false)
    @Builder.Default
    private Integer consecutiveFailures = 0;
    @Column(name = "alert_channel", length = 30)
    private String alertChannel;
    @Column(name = "alert_destination", length = 500)
    private String alertDestination;
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
