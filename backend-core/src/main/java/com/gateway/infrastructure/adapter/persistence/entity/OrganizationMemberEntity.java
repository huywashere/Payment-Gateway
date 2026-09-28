package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "organization_members")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrganizationMemberEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(nullable = false) private String email;
    @Column(name = "display_name") private String displayName;
    @Column(nullable = false) private String role;
    @Column(nullable = false) @Builder.Default private String status = "INVITED";
    @CreationTimestamp @Column(name = "invited_at", updatable = false) private OffsetDateTime invitedAt;
    @Column(name = "joined_at") private OffsetDateTime joinedAt;
}
