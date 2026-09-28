package com.gateway.infrastructure.adapter.processor;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@ConditionalOnProperty(name = "gateway.acquirer.mode", havingValue = "sandbox", matchIfMissing = true)
public class SandboxAcquirerProcessor implements AcquirerProcessor {
    @Override
    public AcquirerResult execute(AcquirerCommand command) {
        String reference = "acq_test_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        if ("declined".equalsIgnoreCase(command.scenario())) {
            return new AcquirerResult("sandbox-acquirer", reference, "FAILED", null, null, "card_declined");
        }
        if ("AUTHORIZE".equals(command.operationType()) && command.requestThreeDs()) {
            return new AcquirerResult("sandbox-acquirer", reference, "REQUIRES_ACTION", "2.2.0",
                    "/3ds/sandbox/" + reference, null);
        }
        String status = switch (command.operationType()) {
            case "AUTHORIZE" -> "AUTHORIZED";
            case "CAPTURE" -> "CAPTURED";
            case "VOID" -> "VOIDED";
            case "REFUND" -> "REFUNDED";
            case "DISPUTE" -> "DISPUTED";
            default -> throw new IllegalArgumentException("Unsupported acquirer operation");
        };
        return new AcquirerResult("sandbox-acquirer", reference, status, null, null, null);
    }
}
