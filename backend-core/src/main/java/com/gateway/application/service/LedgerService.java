package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.entity.*;
import com.gateway.infrastructure.adapter.persistence.repository.LedgerAccountRepository;
import com.gateway.infrastructure.adapter.persistence.repository.LedgerEntryRepository;
import com.gateway.infrastructure.adapter.persistence.repository.SettlementItemRepository;
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
    private final SettlementItemRepository settlementItemRepository;

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
        LedgerAccountEntity clearingAccount = systemAccount("1001_SYSTEM_CLEARING",
                "Cổng thanh toán trung gian Ngân hàng", "ASSET", charge.getCurrency());

        // 2. Get or create Platform Revenue Account
        LedgerAccountEntity platformRevenueAccount = systemAccount("4001_PLATFORM_FEE_REVENUE",
                "Doanh thu phí dịch vụ sàn", "REVENUE", charge.getCurrency());

        // 3. Get or create Merchant Pending Account
        LedgerAccountEntity merchantAccount = merchantAccount(charge.getMerchantId(), "2001_MERCHANT_PENDING_",
                "Merchant pending balance", charge.getCurrency());

        // Entry 1: Bank pays full amount into Merchant account
        // Debit: Clearing (Asset +), Credit: Merchant Pending (Liability +)
        LedgerEntryEntity paymentEntry = LedgerEntryEntity.builder()
                .chargeId(charge.getId())
                .entryType("PAYMENT_GROSS")
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
                    .entryType("PAYMENT_FEE")
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

    @Transactional
    public void recordRefundSucceeded(ChargeEntity charge, RefundEntity refund) {
        if (!ledgerEntryRepository.findByRefundId(refund.getId()).isEmpty()) {
            return;
        }
        LedgerAccountEntity clearingAccount = systemAccount("1001_SYSTEM_CLEARING",
                "Cổng thanh toán trung gian Ngân hàng", "ASSET", charge.getCurrency());
        String prefix = settlementItemRepository.existsByChargeId(charge.getId())
                ? "2002_MERCHANT_AVAILABLE_" : "2001_MERCHANT_PENDING_";
        LedgerAccountEntity merchantAccount = merchantAccount(charge.getMerchantId(), prefix,
                prefix.startsWith("2002") ? "Merchant available balance" : "Merchant pending balance",
                charge.getCurrency());
        ledgerEntryRepository.save(LedgerEntryEntity.builder()
                .chargeId(charge.getId())
                .refundId(refund.getId())
                .entryType("REFUND")
                .debitAccountId(merchantAccount.getId())
                .creditAccountId(clearingAccount.getId())
                .amount(refund.getAmount())
                .currency(refund.getCurrency())
                .description("Customer refund " + refund.getId())
                .build());
        log.info("Recorded refund ledger reversal for refund ID: {}", refund.getId());
    }

    @Transactional(readOnly = true)
    public long getMerchantAvailableBalance(UUID merchantId) {
        return balance(merchantId, "2002_MERCHANT_AVAILABLE_");
    }

    @Transactional(readOnly = true)
    public long getMerchantPendingBalance(UUID merchantId) {
        return balance(merchantId, "2001_MERCHANT_PENDING_");
    }

    @Transactional(readOnly = true)
    public long getMerchantDisputeReserve(UUID merchantId) {
        return balance(merchantId, "2003_MERCHANT_DISPUTE_RESERVE_");
    }

    @Transactional
    public UUID getOrCreateAvailableAccountId(UUID merchantId, String currency) {
        return merchantAccount(merchantId, "2002_MERCHANT_AVAILABLE_",
                "Merchant available balance", currency).getId();
    }

    @Transactional
    public void recordSettlement(SettlementEntity settlement) {
        if (settlement.getNetAmount() <= 0 || !ledgerEntryRepository.findBySettlementId(settlement.getId()).isEmpty()) return;
        LedgerAccountEntity pending = merchantAccount(settlement.getMerchantId(), "2001_MERCHANT_PENDING_",
                "Merchant pending balance", settlement.getCurrency());
        LedgerAccountEntity available = merchantAccount(settlement.getMerchantId(), "2002_MERCHANT_AVAILABLE_",
                "Merchant available balance", settlement.getCurrency());
        ledgerEntryRepository.save(LedgerEntryEntity.builder().settlementId(settlement.getId())
                .entryType("SETTLEMENT")
                .debitAccountId(pending.getId()).creditAccountId(available.getId())
                .amount(settlement.getNetAmount()).currency(settlement.getCurrency())
                .description("Settlement finalized " + settlement.getId()).build());
    }

    @Transactional
    public void recordPayout(PayoutEntity payout) {
        if (!ledgerEntryRepository.findByPayoutId(payout.getId()).isEmpty()) return;
        LedgerAccountEntity available = lockedMerchantAccount(payout.getMerchantId(), "2002_MERCHANT_AVAILABLE_",
                "Merchant available balance", payout.getCurrency());
        long availableBalance = ledgerEntryRepository.calculateAccountBalance(available.getId());
        if (payout.getAmount() > availableBalance) {
            throw new IllegalStateException("Payout amount exceeds available balance: " + availableBalance);
        }
        LedgerAccountEntity clearing = systemAccount("1001_SYSTEM_CLEARING",
                "Cổng thanh toán trung gian Ngân hàng", "ASSET", payout.getCurrency());
        ledgerEntryRepository.save(LedgerEntryEntity.builder().payoutId(payout.getId())
                .entryType("PAYOUT")
                .debitAccountId(available.getId()).creditAccountId(clearing.getId())
                .amount(payout.getAmount()).currency(payout.getCurrency())
                .description("Merchant payout " + payout.getId()).build());
    }

    @Transactional
    public UUID recordDisputeOpened(DisputeEntity dispute) {
        LedgerAccountEntity available = lockedMerchantAccount(dispute.getMerchantId(), "2002_MERCHANT_AVAILABLE_",
                "Merchant available balance", dispute.getCurrency());
        long availableBalance = ledgerEntryRepository.calculateAccountBalance(available.getId());
        if (dispute.getAmount() > availableBalance) {
            throw new IllegalStateException("Merchant available balance cannot cover the dispute reserve");
        }
        LedgerAccountEntity reserve = merchantAccount(dispute.getMerchantId(), "2003_MERCHANT_DISPUTE_RESERVE_",
                "Merchant dispute reserve", dispute.getCurrency());
        ledgerEntryRepository.save(LedgerEntryEntity.builder().disputeId(dispute.getId())
                .chargeId(dispute.getChargeId()).debitAccountId(available.getId()).creditAccountId(reserve.getId())
                .entryType("DISPUTE_HOLD")
                .amount(dispute.getAmount()).currency(dispute.getCurrency())
                .description("Funds reserved for dispute " + dispute.getId()).build());
        return available.getId();
    }

    @Transactional
    public void recordDisputeResolution(DisputeEntity dispute, boolean merchantWon) {
        LedgerAccountEntity reserve = merchantAccount(dispute.getMerchantId(), "2003_MERCHANT_DISPUTE_RESERVE_",
                "Merchant dispute reserve", dispute.getCurrency());
        LedgerAccountEntity creditAccount = merchantWon
                ? ledgerAccountRepository.findById(dispute.getSourceAccountId())
                    .orElseThrow(() -> new IllegalStateException("Dispute source account is missing"))
                : systemAccount("1001_SYSTEM_CLEARING", "Cổng thanh toán trung gian Ngân hàng", "ASSET", dispute.getCurrency());
        ledgerEntryRepository.save(LedgerEntryEntity.builder().disputeId(dispute.getId())
                .chargeId(dispute.getChargeId()).debitAccountId(reserve.getId()).creditAccountId(creditAccount.getId())
                .entryType(merchantWon ? "DISPUTE_RELEASE" : "DISPUTE_LOSS")
                .amount(dispute.getAmount()).currency(dispute.getCurrency())
                .description("Dispute resolved " + (merchantWon ? "WON" : "LOST") + " " + dispute.getId()).build());
    }

    private long balance(UUID merchantId, String prefix) {
        return ledgerAccountRepository
                .findFirstByMerchantIdAndAccountCodeStartingWith(merchantId, prefix)
                .map(account -> ledgerEntryRepository.calculateAccountBalance(account.getId()))
                .orElse(0L);
    }

    private LedgerAccountEntity merchantAccount(UUID merchantId, String prefix, String name, String currency) {
        return ledgerAccountRepository.findFirstByMerchantIdAndAccountCodeStartingWith(merchantId, prefix)
                .orElseGet(() -> ledgerAccountRepository.save(LedgerAccountEntity.builder().merchantId(merchantId)
                        .accountCode(prefix + merchantId.toString().substring(0, 8).toUpperCase())
                        .accountName(name).accountType("LIABILITY").currency(currency).build()));
    }

    private LedgerAccountEntity systemAccount(String code, String name, String type, String currency) {
        return ledgerAccountRepository.findByAccountCode(code).orElseGet(() -> ledgerAccountRepository.save(
                LedgerAccountEntity.builder().accountCode(code).accountName(name).accountType(type)
                        .currency(currency).build()));
    }

    private LedgerAccountEntity lockedMerchantAccount(UUID merchantId, String prefix, String name, String currency) {
        merchantAccount(merchantId, prefix, name, currency);
        return ledgerAccountRepository.findMerchantAccountForUpdate(merchantId, prefix)
                .orElseThrow(() -> new IllegalStateException("Merchant ledger account is missing"));
    }
}
