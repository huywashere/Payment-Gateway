package com.gateway.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "billing_invoices")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BillingInvoiceEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false) private UUID merchantId;
    @Column(name = "invoice_number", nullable = false, unique = true) private String invoiceNumber;
    @Column(name = "period_start", nullable = false) private OffsetDateTime periodStart;
    @Column(name = "period_end", nullable = false) private OffsetDateTime periodEnd;
    @Column(name = "plan_code", nullable = false) private String planCode;
    @Column(nullable = false) private Long subtotal;
    @Column(name = "transaction_fee", nullable = false) private Long transactionFee;
    @Column(nullable = false) private Long total;
    @Column(nullable = false, length = 3) @Builder.Default private String currency = "VND";
    @Column(nullable = false) private String status;
    @Column(name = "issued_at", nullable = false) private OffsetDateTime issuedAt;
    @Column(name = "due_at") private OffsetDateTime dueAt;
    @Column(name = "paid_at") private OffsetDateTime paidAt;
    @CreationTimestamp @Column(name = "created_at", updatable = false) private OffsetDateTime createdAt;
}
