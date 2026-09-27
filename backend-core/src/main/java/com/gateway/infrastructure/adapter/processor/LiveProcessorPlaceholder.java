package com.gateway.infrastructure.adapter.processor;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnExpression("'${gateway.processor.mode:mock}' == 'live' && '${gateway.processor.live-adapter:placeholder}' == 'placeholder'")
public class LiveProcessorPlaceholder implements BankProcessor {
    @Override
    public BankProcessResponse processPayment(BankProcessRequest request) {
        return BankProcessResponse.builder()
                .success(false)
                .errorCode("live_processor_not_configured")
                .errorMessage("A contracted live bank or acquirer adapter must be configured before accepting payments")
                .build();
    }

    @Override
    public String processorCode(String paymentMethodType) {
        return "LIVE_UNCONFIGURED";
    }
}
