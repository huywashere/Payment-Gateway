package com.gateway.infrastructure.adapter.processor;

import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class BankSandboxProcessorTest {
    private final BankSandboxProcessor processor = new BankSandboxProcessor("client", "secret");

    @Test
    void cachesOAuthTokenUntilItApproachesExpiry() {
        assertThat(processor.accessToken()).isEqualTo(processor.accessToken()).startsWith("sboauth_");
    }

    @Test
    void createsBankStyleTransactionReference() {
        BankProcessor.BankProcessResponse response = processor.processPayment(
                BankProcessor.BankProcessRequest.builder().scenario("success")
                        .paymentMethodType("VIETQR").amount(50_000L).currency("VND").build());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getProcessorTransactionId()).startsWith("sbank_txn_");
        assertThat(processor.processorCode("vietqr")).isEqualTo("BANK_SANDBOX_VIETQR");
    }

    @Test
    void paymentOperationIsIdempotentAcrossRetries() {
        BankProcessor.BankProcessRequest request = BankProcessor.BankProcessRequest.builder()
                .operationId("pi_stable_operation").scenario("success")
                .paymentMethodType("VIETQR").amount(50_000L).currency("VND").build();

        String first = processor.processPayment(request).getProcessorTransactionId();
        String replay = new BankSandboxProcessor("other-client", "other-secret")
                .processPayment(request).getProcessorTransactionId();

        assertThat(replay).isEqualTo(first);
    }

    @Test
    void reversalIsIdempotentUnderConcurrency() {
        BankProcessor.BankReversalRequest request = BankProcessor.BankReversalRequest.builder()
                .processorTransactionId("sbank_txn_concurrent123").amount(25_000L)
                .currency("VND").reason("project-test").build();
        Set<String> reversalIds = ConcurrentHashMap.newKeySet();

        IntStream.range(0, 32).parallel().forEach(index ->
                reversalIds.add(new BankSandboxProcessor("client-" + index, "secret")
                        .reversePayment(request).getReversalId()));

        assertThat(reversalIds).hasSize(1);
    }
}
