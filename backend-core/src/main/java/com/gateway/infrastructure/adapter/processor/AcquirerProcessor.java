package com.gateway.infrastructure.adapter.processor;

import java.util.UUID;

public interface AcquirerProcessor {
    AcquirerResult execute(AcquirerCommand command);

    record AcquirerCommand(UUID merchantId, UUID paymentIntentId, String operationType,
                           long amount, String currency, String scenario, boolean requestThreeDs) {
    }

    record AcquirerResult(String processorCode, String processorReference, String status,
                          String threeDsVersion, String actionUrl, String failureCode) {
    }
}
