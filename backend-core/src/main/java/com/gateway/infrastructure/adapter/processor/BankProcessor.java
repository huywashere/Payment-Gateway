package com.gateway.infrastructure.adapter.processor;

import lombok.Builder;
import lombok.Getter;

public interface BankProcessor {
    BankProcessResponse processPayment(BankProcessRequest request);

    default String processorCode(String paymentMethodType) {
        return "MOCK_" + paymentMethodType;
    }

    default BankReversalResponse reversePayment(BankReversalRequest request) {
        return BankReversalResponse.builder()
                .success(false)
                .errorCode("reversal_not_supported")
                .errorMessage("The configured processor does not support reversals")
                .build();
    }

    @Getter
    @Builder
    class BankProcessRequest {
        private String operationId;
        private String processorPaymentMethodToken;
        private String rawCardNumber;
        private String cardHolderName;
        private Integer expMonth;
        private Integer expYear;
        private String cvv;
        private String paymentMethodType;
        private String scenario;
        private Long amount;
        private String currency;
        private String orderDescription;
    }

    @Getter
    @Builder
    class BankProcessResponse {
        private boolean success;
        private boolean requiresAction;
        private String actionUrl;
        private String processorTransactionId;
        private String errorCode;
        private String errorMessage;
    }

    @Getter
    @Builder
    class BankReversalRequest {
        private String operationId;
        private String processorTransactionId;
        private Long amount;
        private String currency;
        private String reason;
    }

    @Getter
    @Builder
    class BankReversalResponse {
        private boolean success;
        private String reversalId;
        private String errorCode;
        private String errorMessage;
    }
}
