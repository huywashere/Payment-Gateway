package com.gateway.infrastructure.adapter.processor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "gateway.processor.mode", havingValue = "bank-sandbox")
public class BankSandboxProcessor implements BankProcessor {
    private final String clientId;
    private final String clientSecret;
    private volatile OAuthToken token;

    public BankSandboxProcessor(
            @Value("${gateway.processor.sandbox-client-id}") String clientId,
            @Value("${gateway.processor.sandbox-client-secret}") String clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public BankProcessResponse processPayment(BankProcessRequest request) {
        return processNewPayment(request);
    }

    private BankProcessResponse processNewPayment(BankProcessRequest request) {
        accessToken();
        String scenario = request.getScenario() == null ? "success" : request.getScenario().toLowerCase(Locale.ROOT);
        if ("requires_action".equals(scenario)) {
            String transactionId = id("txn", request.getOperationId());
            return BankProcessResponse.builder().requiresAction(true)
                    .processorTransactionId(transactionId)
                    .actionUrl("/sandbox/bank/authorize?transaction=" + transactionId).build();
        }
        if ("timeout".equals(scenario)) {
            return failure("bank_timeout", "The simulated bank did not answer before the timeout");
        }
        if ("declined".equals(scenario) || "insufficient_funds".equals(scenario)) {
            return failure(scenario, "The simulated bank declined this transaction");
        }
        return BankProcessResponse.builder().success(true)
                .processorTransactionId(id("txn", request.getOperationId())).build();
    }

    @Override
    public String processorCode(String paymentMethodType) {
        return "BANK_SANDBOX_" + paymentMethodType.toUpperCase(Locale.ROOT);
    }

    @Override
    public BankReversalResponse reversePayment(BankReversalRequest request) {
        accessToken();
        if (request.getProcessorTransactionId() == null || !request.getProcessorTransactionId().startsWith("sbank_txn_")) {
            return reversalFailure("transaction_not_found", "Unknown sandbox bank transaction");
        }
        if (request.getAmount() == null || request.getAmount() <= 0) {
            return reversalFailure("invalid_amount", "Reversal amount must be positive");
        }
        String operationId = request.getOperationId() == null || request.getOperationId().isBlank()
                ? request.getProcessorTransactionId() + ":" + request.getAmount()
                : request.getOperationId();
        String reversalId = id("rev", operationId);
        return BankReversalResponse.builder().success(true).reversalId(reversalId).build();
    }

    public synchronized String accessToken() {
        if (token == null || token.expiresAt().isBefore(Instant.now().plusSeconds(15))) {
            String material = clientId + ":" + clientSecret + ":" + UUID.randomUUID();
            token = new OAuthToken("sboauth_" + sha256(material).substring(0, 32), Instant.now().plusSeconds(300));
        }
        return token.value();
    }

    private BankProcessResponse failure(String code, String message) {
        return BankProcessResponse.builder().success(false).errorCode(code).errorMessage(message).build();
    }

    private BankReversalResponse reversalFailure(String code, String message) {
        return BankReversalResponse.builder().success(false).errorCode(code).errorMessage(message).build();
    }

    private String id(String type, String operationId) {
        String material = operationId == null || operationId.isBlank() ? UUID.randomUUID().toString() : operationId;
        return "sbank_" + type + "_" + sha256(type + ":" + material).substring(0, 20);
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private record OAuthToken(String value, Instant expiresAt) {}
}
