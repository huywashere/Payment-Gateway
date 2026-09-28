package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.entity.BillingInvoiceEntity;
import com.gateway.infrastructure.adapter.persistence.entity.SubscriptionEventEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PlanEntity;
import com.gateway.infrastructure.adapter.persistence.repository.BillingInvoiceRepository;
import com.gateway.infrastructure.adapter.persistence.repository.SubscriptionEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class BillingService {
    private final BillingInvoiceRepository invoiceRepository;
    private final SubscriptionEventRepository eventRepository;

    @Transactional(readOnly = true)
    public List<BillingInvoiceEntity> invoices(UUID merchantId) {
        return invoiceRepository.findByMerchantIdOrderByIssuedAtDesc(merchantId);
    }

    @Transactional(readOnly = true)
    public List<SubscriptionEventEntity> events(UUID merchantId) {
        return eventRepository.findTop50ByMerchantIdOrderByCreatedAtDesc(merchantId);
    }

    @Transactional(readOnly = true)
    public byte[] invoiceCsv(UUID merchantId, UUID invoiceId) {
        BillingInvoiceEntity invoice = invoiceRepository.findByIdAndMerchantId(invoiceId, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
        String csv = "invoice_number,period_start,period_end,plan,subtotal,transaction_fee,total,currency,status\r\n"
                + String.join(",", invoice.getInvoiceNumber(), invoice.getPeriodStart().toString(),
                invoice.getPeriodEnd().toString(), invoice.getPlanCode(), String.valueOf(invoice.getSubtotal()),
                String.valueOf(invoice.getTransactionFee()), String.valueOf(invoice.getTotal()),
                invoice.getCurrency(), invoice.getStatus()) + "\r\n";
        return ("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8);
    }

    @Transactional
    public BillingInvoiceEntity issuePlanInvoice(UUID merchantId, PlanEntity plan,
                                                 OffsetDateTime periodStart, OffsetDateTime periodEnd) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        String number = "INV-" + now.toLocalDate().toString().replace("-", "") + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        long total = plan.getMonthlyPrice();
        return invoiceRepository.save(BillingInvoiceEntity.builder()
                .merchantId(merchantId).invoiceNumber(number).periodStart(periodStart).periodEnd(periodEnd)
                .planCode(plan.getCode()).subtotal(total).transactionFee(0L).total(total).currency("VND")
                .status("PAID").issuedAt(now).dueAt(now.plusDays(7)).paidAt(now).build());
    }
}
