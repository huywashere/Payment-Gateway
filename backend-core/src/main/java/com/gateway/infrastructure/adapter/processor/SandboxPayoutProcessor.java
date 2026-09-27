package com.gateway.infrastructure.adapter.processor;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
@ConditionalOnExpression("'${gateway.processor.mode:mock}' != 'live'")
public class SandboxPayoutProcessor implements PayoutProcessor {
    @Override
    public PayoutProcessResponse createPayout(PayoutProcessRequest request) {
        return PayoutProcessResponse.builder()
                .success(true)
                .processorPayoutId("po_sandbox_" + sha256(request.getOperationId()).substring(0, 20))
                .build();
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
