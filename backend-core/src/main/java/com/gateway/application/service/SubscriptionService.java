package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.entity.MerchantSubscriptionEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PlanEntity;
import com.gateway.infrastructure.adapter.persistence.repository.MerchantSubscriptionRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PlanRepository;
import com.gateway.infrastructure.adapter.persistence.repository.BankAccountRepository;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookEndpointRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionService {
    private final MerchantSubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final BankAccountRepository bankAccountRepository;
    private final WebhookEndpointRepository webhookEndpointRepository;

    @Transactional(readOnly = true)
    public void assertPaymentAllowed(UUID merchantId) {
        PlanEntity plan = plan(merchantId);
        OffsetDateTime start = OffsetDateTime.now(ZoneOffset.UTC).withDayOfMonth(1).toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
        long usage = paymentIntentRepository.countByMerchantIdAndCreatedAtAfter(merchantId, start);
        if (usage >= plan.getMonthlyPaymentLimit()) throw new IllegalStateException("Monthly payment quota exceeded for plan " + plan.getCode());
    }

    @Transactional(readOnly = true)
    public void assertBankAccountAllowed(UUID merchantId, long current) {
        PlanEntity plan = plan(merchantId);
        if (current >= plan.getBankAccountLimit()) throw new IllegalStateException("Bank account quota exceeded for plan " + plan.getCode());
    }

    @Transactional(readOnly = true)
    public void assertWebhookAllowed(UUID merchantId, long current) {
        PlanEntity plan = plan(merchantId);
        if (current >= plan.getWebhookEndpointLimit()) throw new IllegalStateException("Webhook endpoint quota exceeded for plan " + plan.getCode());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> summary(UUID merchantId) {
        MerchantSubscriptionEntity subscription = subscriptionRepository.findById(merchantId)
                .orElseThrow(() -> new IllegalStateException("Merchant subscription is missing"));
        PlanEntity plan = planRepository.findById(subscription.getPlanCode()).orElseThrow();
        long usage = paymentIntentRepository.countByMerchantIdAndCreatedAtAfter(merchantId, subscription.getCurrentPeriodStart());
        long bankUsage = bankAccountRepository.countByMerchantIdAndStatusNot(merchantId, "DISABLED");
        long webhookUsage = webhookEndpointRepository.countByMerchantIdAndStatus(merchantId, "ACTIVE");
        return Map.ofEntries(
                Map.entry("plan", plan.getCode()), Map.entry("plan_name", plan.getDisplayName()),
                Map.entry("status", subscription.getStatus()), Map.entry("monthly_price", plan.getMonthlyPrice()),
                Map.entry("payment_usage", usage), Map.entry("payment_limit", plan.getMonthlyPaymentLimit()),
                Map.entry("bank_account_usage", bankUsage), Map.entry("bank_account_limit", plan.getBankAccountLimit()),
                Map.entry("webhook_endpoint_usage", webhookUsage),
                Map.entry("webhook_endpoint_limit", plan.getWebhookEndpointLimit()),
                Map.entry("period_start", subscription.getCurrentPeriodStart()),
                Map.entry("period_end", subscription.getCurrentPeriodEnd()));
    }

    @Transactional(readOnly = true)
    public List<PlanEntity> plans() { return planRepository.findAll(); }

    @Transactional
    public Map<String, Object> changePlan(UUID merchantId, String planCode) {
        PlanEntity plan = planRepository.findById(planCode.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Unknown plan"));
        MerchantSubscriptionEntity subscription = subscriptionRepository.findById(merchantId)
                .orElseThrow(() -> new IllegalStateException("Merchant subscription is missing"));
        subscription.setPlanCode(plan.getCode());
        subscription.setStatus("ACTIVE");
        subscriptionRepository.save(subscription);
        return summary(merchantId);
    }

    private PlanEntity plan(UUID merchantId) {
        MerchantSubscriptionEntity subscription = subscriptionRepository.findById(merchantId)
                .orElseThrow(() -> new IllegalStateException("Merchant subscription is missing"));
        if (!"ACTIVE".equals(subscription.getStatus()) && !"TRIALING".equals(subscription.getStatus())) {
            throw new IllegalStateException("Merchant subscription is not active");
        }
        return planRepository.findById(subscription.getPlanCode()).orElseThrow();
    }
}
