package com.gateway.application.service;

import com.gateway.domain.model.payment.PaymentIntentStatus;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.repository.BankTransactionRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DashboardAnalyticsServiceTest {
    private final PaymentIntentRepository intents = mock(PaymentIntentRepository.class);
    private final BankTransactionRepository bankTransactions = mock(BankTransactionRepository.class);
    private final LedgerService ledger = mock(LedgerService.class);
    private final PortalNotificationService notifications = mock(PortalNotificationService.class);
    private final DashboardAnalyticsService service = new DashboardAnalyticsService(intents, bankTransactions, ledger, notifications);

    @Test
    void aggregatesOnlySucceededVolumeAndBuildsRequestedSeries() {
        UUID merchantId = UUID.randomUUID();
        OffsetDateTime createdAt = OffsetDateTime.now(ZoneOffset.UTC).minusHours(2);
        when(intents.findByMerchantIdAndCreatedAtAfterOrderByCreatedAtAsc(eq(merchantId), any()))
                .thenReturn(List.of(intent(100_000, PaymentIntentStatus.SUCCEEDED, createdAt),
                        intent(50_000, PaymentIntentStatus.FAILED, createdAt),
                        intent(25_000, PaymentIntentStatus.PROCESSING, createdAt)));
        when(bankTransactions.findByMerchantIdAndReceivedAtAfterOrderByReceivedAtAsc(eq(merchantId), any()))
                .thenReturn(List.of());
        when(ledger.getMerchantAvailableBalance(merchantId)).thenReturn(95_000L);
        when(ledger.getMerchantPendingBalance(merchantId)).thenReturn(5_000L);
        when(notifications.unreadCount(merchantId)).thenReturn(2L);

        Map<String, Object> result = service.overview(merchantId, 7);

        assertThat(result).containsEntry("range_days", 7).containsEntry("gross_volume", 100_000L)
                .containsEntry("payment_count", 3).containsEntry("succeeded_count", 1L)
                .containsEntry("failed_count", 1L).containsEntry("available_balance", 95_000L)
                .containsEntry("unread_notifications", 2L);
        assertThat((List<?>) result.get("daily")).hasSize(7);
        assertThat((Double) result.get("success_rate")).isEqualTo(33.3d);
    }

    @Test
    void rejectsUnsupportedRangeByFallingBackToThirtyDays() {
        UUID merchantId = UUID.randomUUID();
        when(intents.findByMerchantIdAndCreatedAtAfterOrderByCreatedAtAsc(eq(merchantId), any())).thenReturn(List.of());
        when(bankTransactions.findByMerchantIdAndReceivedAtAfterOrderByReceivedAtAsc(eq(merchantId), any())).thenReturn(List.of());
        assertThat(service.overview(merchantId, 365)).containsEntry("range_days", 30);
    }

    private PaymentIntentEntity intent(long amount, PaymentIntentStatus status, OffsetDateTime createdAt) {
        return PaymentIntentEntity.builder().id(UUID.randomUUID()).merchantId(UUID.randomUUID()).amount(amount)
                .currency("VND").status(status).clientSecret(UUID.randomUUID().toString()).version(0L)
                .createdAt(createdAt).build();
    }
}
