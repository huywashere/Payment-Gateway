package com.gateway.infrastructure.adapter.processor;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnExpression("'${gateway.processor.mode:mock}' == 'live' && '${gateway.processor.live-payout-adapter:placeholder}' == 'placeholder'")
public class LivePayoutProcessorPlaceholder implements PayoutProcessor {
    @Override
    public PayoutProcessResponse createPayout(PayoutProcessRequest request) {
        return PayoutProcessResponse.builder().success(false)
                .errorCode("live_payout_processor_not_configured")
                .errorMessage("A contracted live payout adapter must be configured").build();
    }
}
