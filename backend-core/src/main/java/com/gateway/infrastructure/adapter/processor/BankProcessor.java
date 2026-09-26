package com.gateway.infrastructure.adapter.processor;

import lombok.Builder;
import lombok.Getter;

public interface BankProcessor {
    BankProcessResponse processPayment(BankProcessRequest request);

    @Getter
    @Builder
    class BankProcessRequest {
        private String rawCardNumber;
        private String cardHolderName;
        private Integer expMonth;
        private Integer expYear;
        private String cvv;
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
}
