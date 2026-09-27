package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "merchant_id")
    private UUID merchantId;
    @Column(name = "actor_type", nullable = false)
    private String actorType;
    @Column(name = "actor_id", nullable = false)
    private String actorId;
    @Column(nullable = false)
    private String action;
    @Column(name = "resource_type", nullable = false)
    private String resourceType;
    @Column(name = "resource_id")
    private String resourceId;
    @Column(name = "request_id")
    private String requestId;
    @Column(name = "ip_address")
    private String ipAddress;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String details;
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}

