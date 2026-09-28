package com.gateway.infrastructure.adapter.processor;

import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class BankSandboxProcessorTest {
    private final BankSandboxProcessor processor = new BankSandboxProcessor("client", "secret");

    @Test
    void cachesOAuthTokenUntilItApproachesExpiry() {
        assertThat(processor.accessToken()).isEqualTo(processor.accessToken()).startsWith("acb_oauth_");
    }

    @Test
    void routesAllFourSupportedBanks() {
        List<String> banks = List.of("ACB", "BIDV", "VIETINBANK", "NCB");
        for (String bank : banks) {
            BankProcessor.BankProcessResponse response = processor.processPayment(
                    BankProcessor.BankProcessRequest.builder().operationId("pi_" + bank).bankCode(bank)
                            .scenario("success").paymentMethodType("VIETQR")
                            .amount(50_000L).currency("VND").build());

            assertThat(response.isSuccess()).isTrue();
            assertThat(response.getProcessorTransactionId()).startsWith(bank.toLowerCase() + "_txn_");
            assertThat(processor.processorCode("vietqr", bank)).isEqualTo(bank + "_SANDBOX_VIETQR");
        }
        assertThat(processor.availableBanks()).hasSize(4);
    }

    @Test
    void paymentOperationIsIdempotentAcrossRetries() {
        BankProcessor.BankProcessRequest request = BankProcessor.BankProcessRequest.builder()
                .operationId("pi_stable_operation").scenario("success")
                .bankCode("BIDV").paymentMethodType("VIETQR").amount(50_000L).currency("VND").build();

        String first = processor.processPayment(request).getProcessorTransactionId();
        String replay = new BankSandboxProcessor("other-client", "other-secret")
                .processPayment(request).getProcessorTransactionId();

        assertThat(replay).isEqualTo(first);
    }

    @Test
    void reversalIsIdempotentUnderConcurrency() {
        BankProcessor.BankReversalRequest request = BankProcessor.BankReversalRequest.builder()
                .processorTransactionId("ncb_txn_concurrent123").amount(25_000L)
                .currency("VND").reason("project-test").build();
        Set<String> reversalIds = ConcurrentHashMap.newKeySet();

        IntStream.range(0, 32).parallel().forEach(index ->
                reversalIds.add(new BankSandboxProcessor("client-" + index, "secret")
                        .reversePayment(request).getReversalId()));

        assertThat(reversalIds).hasSize(1);
        assertThat(reversalIds.iterator().next()).startsWith("ncb_rev_");
    }

    @Test
    void rejectsCrossBankReversal() {
        var result = processor.reversePayment(BankProcessor.BankReversalRequest.builder()
                .bankCode("ACB").processorTransactionId("bidv_txn_123")
                .amount(10_000L).currency("VND").build());

        assertThat(result.isSuccess()).isFalse();
        assertThat(result.getErrorCode()).isEqualTo("transaction_not_found");
    }

    @Test
    void keepsLegacySandboxTransactionsRefundableThroughDefaultBank() {
        var result = processor.reversePayment(BankProcessor.BankReversalRequest.builder()
                .processorTransactionId("sbank_txn_legacy123").amount(10_000L).currency("VND").build());

        assertThat(result.isSuccess()).isTrue();
        assertThat(result.getReversalId()).startsWith("acb_rev_");
    }
}
