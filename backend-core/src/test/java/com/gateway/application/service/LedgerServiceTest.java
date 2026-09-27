package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import com.gateway.infrastructure.adapter.persistence.entity.LedgerAccountEntity;
import com.gateway.infrastructure.adapter.persistence.entity.LedgerEntryEntity;
import com.gateway.infrastructure.adapter.persistence.repository.LedgerAccountRepository;
import com.gateway.infrastructure.adapter.persistence.repository.LedgerEntryRepository;
import com.gateway.infrastructure.adapter.persistence.repository.SettlementItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LedgerServiceTest {
    private final LedgerAccountRepository accounts = mock(LedgerAccountRepository.class);
    private final LedgerEntryRepository entries = mock(LedgerEntryRepository.class);
    private final SettlementItemRepository settlements = mock(SettlementItemRepository.class);
    private final LedgerService ledger = new LedgerService(accounts, entries, settlements);

    @BeforeEach
    void configureFees() {
        ReflectionTestUtils.setField(ledger, "fixedFeeVnd", 2_000L);
        ReflectionTestUtils.setField(ledger, "percentageFee", 0.015d);
    }

    @Test
    void calculatesDeterministicIntegerFee() {
        assertThat(ledger.calculateFee(200_000L)).isEqualTo(5_000L);
    }

    @Test
    void successfulPaymentCreatesBalancedDoubleEntryPostings() {
        UUID merchant = UUID.randomUUID();
        LedgerAccountEntity clearing = account(null, "1001_SYSTEM_CLEARING");
        LedgerAccountEntity revenue = account(null, "4001_PLATFORM_FEE_REVENUE");
        LedgerAccountEntity pending = account(merchant, "2001_MERCHANT_PENDING_TEST");
        when(accounts.findByAccountCode("1001_SYSTEM_CLEARING")).thenReturn(Optional.of(clearing));
        when(accounts.findByAccountCode("4001_PLATFORM_FEE_REVENUE")).thenReturn(Optional.of(revenue));
        when(accounts.findFirstByMerchantIdAndAccountCodeStartingWith(merchant, "2001_MERCHANT_PENDING_"))
                .thenReturn(Optional.of(pending));

        ledger.recordPaymentSucceeded(ChargeEntity.builder().id(UUID.randomUUID()).merchantId(merchant)
                .amount(200_000L).feeAmount(5_000L).currency("VND").processorCode("BANK_SANDBOX_VIETQR").build());

        ArgumentCaptor<LedgerEntryEntity> captor = ArgumentCaptor.forClass(LedgerEntryEntity.class);
        verify(entries, times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).allSatisfy(entry -> {
            assertThat(entry.getAmount()).isPositive();
            assertThat(entry.getDebitAccountId()).isNotEqualTo(entry.getCreditAccountId());
            assertThat(entry.getCurrency()).isEqualTo("VND");
        });
        assertThat(captor.getAllValues()).extracting(LedgerEntryEntity::getAmount)
                .containsExactly(200_000L, 5_000L);
        assertThat(captor.getAllValues()).extracting(LedgerEntryEntity::getEntryType)
                .containsExactly("PAYMENT_GROSS", "PAYMENT_FEE");
    }

    private LedgerAccountEntity account(UUID merchant, String code) {
        return LedgerAccountEntity.builder().id(UUID.randomUUID()).merchantId(merchant)
                .accountCode(code).accountName(code).accountType("LIABILITY").currency("VND").build();
    }
}
