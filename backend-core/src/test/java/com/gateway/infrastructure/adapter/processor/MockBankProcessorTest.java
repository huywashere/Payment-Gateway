package com.gateway.infrastructure.adapter.processor;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MockBankProcessorTest {

    private final MockBankProcessor processor = new MockBankProcessor();

    @Test
    void completesVietQrSandboxPayment() {
        BankProcessor.BankProcessResponse response = processor.processPayment(
                BankProcessor.BankProcessRequest.builder()
                        .paymentMethodType("VIETQR")
                        .scenario("success")
                        .amount(150_000L)
                        .currency("VND")
                        .build());

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getProcessorTransactionId()).startsWith("bank_vietqr_");
    }

    @Test
    void requiresActionForThreeDsScenario() {
        BankProcessor.BankProcessResponse response = processor.processPayment(
                BankProcessor.BankProcessRequest.builder()
                        .paymentMethodType("CARD")
                        .scenario("requires_action")
                        .build());

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.isRequiresAction()).isTrue();
        assertThat(response.getActionUrl()).contains("sandbox/3ds");
    }

    @Test
    void exposesStableDeclineCode() {
        BankProcessor.BankProcessResponse response = processor.processPayment(
                BankProcessor.BankProcessRequest.builder()
                        .paymentMethodType("CARD")
                        .scenario("declined")
                        .build());

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode()).isEqualTo("payment_declined");
    }

    @Test
    void operationIdProducesSameReferenceAcrossProcessorInstances() {
        BankProcessor.BankProcessRequest request = BankProcessor.BankProcessRequest.builder()
                .operationId("pi_cross_replica")
                .paymentMethodType("VIETQR")
                .scenario("success")
                .amount(150_000L)
                .currency("VND")
                .build();

        String first = new MockBankProcessor().processPayment(request).getProcessorTransactionId();
        String replay = new MockBankProcessor().processPayment(request).getProcessorTransactionId();

        assertThat(replay).isEqualTo(first);
    }
}
