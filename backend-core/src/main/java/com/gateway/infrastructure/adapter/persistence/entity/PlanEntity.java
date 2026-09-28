package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PlanEntity {
    @Id private String code;
    @Column(name = "display_name", nullable = false) private String displayName;
    @Column(name = "monthly_price", nullable = false) private Long monthlyPrice;
    @Column(name = "monthly_payment_limit", nullable = false) private Integer monthlyPaymentLimit;
    @Column(name = "bank_account_limit", nullable = false) private Integer bankAccountLimit;
    @Column(name = "webhook_endpoint_limit", nullable = false) private Integer webhookEndpointLimit;
    @Column(name = "retention_days", nullable = false) private Integer retentionDays;
}
