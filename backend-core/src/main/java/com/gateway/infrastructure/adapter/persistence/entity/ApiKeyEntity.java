package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "api_keys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiKeyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "merchant_id", nullable = false)
    private UUID merchantId;

    @Column(name = "key_prefix", nullable = false, length = 16)
    private String keyPrefix;

    @Column(name = "secret_hash", nullable = false)
    private String secretHash;

    @Column(name = "key_type", nullable = false, length = 20)
    private String keyType; // PUBLISHABLE, SECRET

    @Column(name = "environment", nullable = false, length = 20)
    @Builder.Default
    private String environment = "TEST"; // TEST, LIVE

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "display_name", nullable = false, length = 100)
    @Builder.Default
    private String displayName = "Default key";

    @Column(name = "scopes", nullable = false, columnDefinition = "TEXT")
    @Builder.Default
    private String scopes = "*";

    @Column(name = "last_used_at")
    private OffsetDateTime lastUsedAt;

    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
