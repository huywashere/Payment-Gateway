package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import com.gateway.infrastructure.adapter.persistence.entity.LedgerAccountEntity;
import com.gateway.infrastructure.adapter.persistence.entity.LedgerEntryEntity;
import com.gateway.infrastructure.adapter.persistence.repository.LedgerAccountRepository;
import com.gateway.infrastructure.adapter.persistence.repository.LedgerEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerService {

    private final LedgerAccountRepository ledgerAccountRepository;
    private final LedgerEntryRepository ledgerEntryRepository;

    @Value("${gateway.fee.fixed-fee-vnd:2000}")
    private long fixedFeeVnd;

    @Value("${gateway.fee.percentage-fee:0.015}")
    private double percentageFee;

    public long calculateFee(long amount) {
        long variableFee = Math.round(amount * percentageFee);
        return fixedFeeVnd + variableFee;
    }

    @Transactional
    public void recordPaymentSucceeded(ChargeEntity charge) {
        log.info("Recording double-entry ledger entries for charge ID: {}, amount: {} VND",
                charge.getId(), charge.getAmount());

        // 1. Get or create System Clearing Bank Account (Asset)
        LedgerAccountEntity clearingAccount = ledgerAccountRepository.findByAccountCode("1001_SYSTEM_CLEARING")
                .orElseGet(() -> ledgerAccountRepository.save(LedgerAccountEntity.builder()
                        .accountCode("1001_SYSTEM_CLEARING")
                        .accountName("Cổng thanh toán trung gian Ngân hàng")
                        .accountType("ASSET")
                        .currency(charge.getCurrency())
                        .build()));

        // 2. Get or create Platform Revenue Account
        LedgerAccountEntity platformRevenueAccount = ledgerAccountRepository.findByAccountCode("4001_PLATFORM_FEE_REVENUE")
                .orElseGet(() -> ledgerAccountRepository.save(LedgerAccountEntity.builder()
                        .accountCode("4001_PLATFORM_FEE_REVENUE")
                        .accountName("Doanh thu phí dịch vụ sàn")
                        .accountType("REVENUE")
                        .currency(charge.getCurrency())
                        .build()));

        // 3. Get or create Merchant Pending Account
        String merchantAccountCode = "2001_MERCHANT_PENDING_" + charge.getMerchantId().toString().substring(0, 8);
        LedgerAccountEntity merchantAccount = ledgerAccountRepository.findByMerchantIdAndAccountCode(charge.getMerchantId(), merchantAccountCode)
                .orElseGet(() -> ledgerAccountRepository.save(LedgerAccountEntity.builder()
                        .merchantId(charge.getMerchantId())
                        .accountCode(merchantAccountCode)
                        .accountName("Số dư chờ đối soát Merchant " + charge.getMerchantId())
                        .accountType("LIABILITY")
                        .currency(charge.getCurrency())
                        .build()));

        // Entry 1: Bank pays full amount into Merchant account
        // Debit: Clearing (Asset +), Credit: Merchant Pending (Liability +)
        LedgerEntryEntity paymentEntry = LedgerEntryEntity.builder()
                .chargeId(charge.getId())
                .debitAccountId(clearingAccount.getId())
                .creditAccountId(merchantAccount.getId())
                .amount(charge.getAmount())
                .currency(charge.getCurrency())
                .description("Customer payment collected via " + charge.getProcessorCode())
                .build();
        ledgerEntryRepository.save(paymentEntry);

        // Entry 2: Platform fee deducted from Merchant account
        // Debit: Merchant Pending (Liability -), Credit: Platform Revenue (Revenue +)
        if (charge.getFeeAmount() > 0) {
            LedgerEntryEntity feeEntry = LedgerEntryEntity.builder()
                    .chargeId(charge.getId())
                    .debitAccountId(merchantAccount.getId())
                    .creditAccountId(platformRevenueAccount.getId())
                    .amount(charge.getFeeAmount())
                    .currency(charge.getCurrency())
                    .description("Platform gateway processing fee")
                    .build();
            ledgerEntryRepository.save(feeEntry);
        }

        log.info("Successfully committed double-entry ledger for charge ID: {}", charge.getId());
    }

    @Transactional(readOnly = true)
    public long getMerchantAvailableBalance(UUID merchantId) {
        String merchantAccountCode = "2001_MERCHANT_PENDING_" + merchantId.toString().substring(0, 8);
        return ledgerAccountRepository.findByMerchantIdAndAccountCode(merchantId, merchantAccountCode)
                .map(account -> ledgerEntryRepository.calculateAccountBalance(account.getId()))
                .orElse(0L);
    }
}
