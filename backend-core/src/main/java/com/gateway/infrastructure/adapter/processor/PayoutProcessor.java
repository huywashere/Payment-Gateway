package com.gateway.infrastructure.adapter.processor;

import lombok.Builder;
import lombok.Getter;

public interface PayoutProcessor {
    PayoutProcessResponse createPayout(PayoutProcessRequest request);

    @Getter
    @Builder
    class PayoutProcessRequest {
        private String operationId;
        private Long amount;
        private String currency;
        private String destinationReference;
        private String description;
    }

    @Getter
    @Builder
    class PayoutProcessResponse {
        private boolean success;
        private String processorPayoutId;
        private String errorCode;
        private String errorMessage;
    }
}
