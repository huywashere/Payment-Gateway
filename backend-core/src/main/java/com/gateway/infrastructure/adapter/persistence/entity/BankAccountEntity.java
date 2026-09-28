package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "bank_accounts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BankAccountEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "bank_code", nullable = false, length = 30) private String bankCode;
    @Column(name = "bank_bin", nullable = false, length = 6) private String bankBin;
    @Column(name = "account_number", nullable = false, length = 30) private String accountNumber;
    @Column(name = "account_name", nullable = false) private String accountName;
    @Column(name = "account_type", nullable = false) @Builder.Default private String accountType = "BUSINESS";
    @Column(name = "connection_mode", nullable = false) @Builder.Default private String connectionMode = "MANUAL";
    @Column(name = "connection_reference") private String connectionReference;
    @Column(nullable = false) @Builder.Default private String status = "ACTIVE";
    @Column(name = "is_default", nullable = false) private boolean defaultAccount;
    @Column(name = "last_synced_at") private OffsetDateTime lastSyncedAt;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
    @UpdateTimestamp @Column(name = "updated_at") private OffsetDateTime updatedAt;
}
