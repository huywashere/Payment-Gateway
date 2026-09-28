package com.gateway.infrastructure.adapter.processor;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "gateway.acquirer.mode", havingValue = "live")
public class LiveAcquirerPlaceholder implements AcquirerProcessor {
    @Override
    public AcquirerResult execute(AcquirerCommand command) {
        throw new IllegalStateException("No contracted live acquirer adapter is configured");
    }
}
