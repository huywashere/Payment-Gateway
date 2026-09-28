package com.gateway.application.service;

import com.gateway.domain.model.payment.PaymentIntentStatus;
import com.gateway.infrastructure.adapter.persistence.entity.BankTransactionEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.repository.BankTransactionRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardAnalyticsService {
    private final PaymentIntentRepository paymentIntentRepository;
    private final BankTransactionRepository bankTransactionRepository;
    private final LedgerService ledgerService;
    private final PortalNotificationService notificationService;

    @Transactional(readOnly = true)
    public Map<String, Object> overview(UUID merchantId, int requestedDays) {
        int days = Set.of(7, 30, 90).contains(requestedDays) ? requestedDays : 30;
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime start = now.minusDays(days - 1L).toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
        List<PaymentIntentEntity> intents = paymentIntentRepository
                .findByMerchantIdAndCreatedAtAfterOrderByCreatedAtAsc(merchantId, start);
        List<BankTransactionEntity> bankTransactions = bankTransactionRepository
                .findByMerchantIdAndReceivedAtAfterOrderByReceivedAtAsc(merchantId, start);

        long gross = intents.stream().filter(item -> item.getStatus() == PaymentIntentStatus.SUCCEEDED)
                .mapToLong(PaymentIntentEntity::getAmount).sum();
        long succeeded = intents.stream().filter(item -> item.getStatus() == PaymentIntentStatus.SUCCEEDED).count();
        long failed = intents.stream().filter(item -> item.getStatus() == PaymentIntentStatus.FAILED
                || item.getStatus() == PaymentIntentStatus.CANCELED).count();
        double successRate = intents.isEmpty() ? 0 : succeeded * 100.0 / intents.size();

        Map<LocalDate, long[]> daily = new LinkedHashMap<>();
        for (int index = days - 1; index >= 0; index--) daily.put(now.toLocalDate().minusDays(index), new long[2]);
        intents.forEach(item -> {
            long[] bucket = daily.get(item.getCreatedAt().toLocalDate());
            if (bucket != null) {
                bucket[0]++;
                if (item.getStatus() == PaymentIntentStatus.SUCCEEDED) bucket[1] += item.getAmount();
            }
        });

        List<Map<String, Object>> series = daily.entrySet().stream().map(entry -> Map.<String, Object>of(
                "date", entry.getKey().format(DateTimeFormatter.ISO_DATE),
                "count", entry.getValue()[0], "amount", entry.getValue()[1])).toList();
        Map<String, Long> bankStatus = new TreeMap<>();
        bankTransactions.forEach(item -> bankStatus.merge(item.getMatchStatus(), 1L, Long::sum));

        return Map.ofEntries(
                Map.entry("generated_at", now), Map.entry("range_days", days),
                Map.entry("gross_volume", gross), Map.entry("payment_count", intents.size()),
                Map.entry("succeeded_count", succeeded), Map.entry("failed_count", failed),
                Map.entry("success_rate", Math.round(successRate * 10.0) / 10.0),
                Map.entry("available_balance", ledgerService.getMerchantAvailableBalance(merchantId)),
                Map.entry("pending_balance", ledgerService.getMerchantPendingBalance(merchantId)),
                Map.entry("unread_notifications", notificationService.unreadCount(merchantId)),
                Map.entry("daily", series), Map.entry("bank_transaction_status", bankStatus));
    }
}
