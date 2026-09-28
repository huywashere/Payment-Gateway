package com.gateway.infrastructure.adapter.processor;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@ConditionalOnProperty(name = "gateway.processor.mode", havingValue = "bank-sandbox")
public class BankSandboxProcessor implements BankProcessor {
    private final BankSandboxProperties properties;
    private final Map<SandboxBank, OAuthToken> tokens = new ConcurrentHashMap<>();

    @Autowired
    public BankSandboxProcessor(BankSandboxProperties properties) {
        this.properties = properties;
    }

    BankSandboxProcessor(String clientId, String clientSecret) {
        this.properties = new BankSandboxProperties();
        this.properties.setSandboxClientId(clientId);
        this.properties.setSandboxClientSecret(clientSecret);
    }

    @Override
    public BankProcessResponse processPayment(BankProcessRequest request) {
        return processNewPayment(request);
    }

    private BankProcessResponse processNewPayment(BankProcessRequest request) {
        SandboxBank bank = resolve(request.getBankCode());
        accessToken(bank.name());
        String scenario = request.getScenario() == null ? "success" : request.getScenario().toLowerCase(Locale.ROOT);
        if ("requires_action".equals(scenario)) {
            String transactionId = id(bank, "txn", request.getOperationId());
            return BankProcessResponse.builder().requiresAction(true)
                    .processorTransactionId(transactionId)
                    .actionUrl("/sandbox/bank/" + bank.name() + "/authorize?transaction=" + transactionId).build();
        }
        if ("timeout".equals(scenario)) {
            return failure("bank_timeout", "The simulated bank did not answer before the timeout");
        }
        if ("declined".equals(scenario) || "insufficient_funds".equals(scenario)) {
            return failure(scenario, "The simulated bank declined this transaction");
        }
        return BankProcessResponse.builder().success(true)
                .processorTransactionId(id(bank, "txn", request.getOperationId())).build();
    }

    @Override
    public String processorCode(String paymentMethodType) {
        return processorCode(paymentMethodType, null);
    }

    @Override
    public String processorCode(String paymentMethodType, String bankCode) {
        return resolve(bankCode).name() + "_SANDBOX_" + paymentMethodType.toUpperCase(Locale.ROOT);
    }

    @Override
    public String resolveBankCode(String bankCode) {
        return resolve(bankCode).name();
    }

    @Override
    public String bankCodeFromTransactionId(String processorTransactionId) {
        SandboxBank bank = SandboxBank.fromTransactionId(processorTransactionId);
        if (bank != null) return bank.name();
        return processorTransactionId != null && processorTransactionId.startsWith("sbank_txn_")
                ? resolve(null).name() : null;
    }

    @Override
    public List<Map<String, Object>> availableBanks() {
        return java.util.Arrays.stream(SandboxBank.values()).map(bank -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("code", bank.name());
            result.put("name", bank.displayName());
            result.put("mode", "simulated-sandbox");
            result.put("capabilities", List.of("payment", "callback", "reversal"));
            return result;
        }).toList();
    }

    @Override
    public BankReversalResponse reversePayment(BankReversalRequest request) {
        SandboxBank inferred = SandboxBank.fromTransactionId(request.getProcessorTransactionId());
        boolean legacyTransaction = request.getProcessorTransactionId() != null
                && request.getProcessorTransactionId().startsWith("sbank_txn_");
        if (inferred == null && legacyTransaction) inferred = resolve(null);
        SandboxBank requested = request.getBankCode() == null || request.getBankCode().isBlank()
                ? null : SandboxBank.fromCode(request.getBankCode());
        if (inferred == null || (requested != null && requested != inferred)) {
            return reversalFailure("transaction_not_found", "Unknown sandbox bank transaction");
        }
        accessToken(inferred.name());
        if (request.getAmount() == null || request.getAmount() <= 0) {
            return reversalFailure("invalid_amount", "Reversal amount must be positive");
        }
        String operationId = request.getOperationId() == null || request.getOperationId().isBlank()
                ? request.getProcessorTransactionId() + ":" + request.getAmount()
                : request.getOperationId();
        String reversalId = id(inferred, "rev", operationId);
        return BankReversalResponse.builder().success(true).reversalId(reversalId).build();
    }

    public synchronized String accessToken() {
        return accessToken(null);
    }

    public synchronized String accessToken(String bankCode) {
        SandboxBank bank = resolve(bankCode);
        OAuthToken token = tokens.get(bank);
        if (token == null || token.expiresAt().isBefore(Instant.now().plusSeconds(15))) {
            BankSandboxProperties.Credentials credentials = properties.credentials(bank);
            String material = credentials.clientId() + ":" + credentials.clientSecret() + ":" + UUID.randomUUID();
            token = new OAuthToken(bank.idPrefix() + "_oauth_" + sha256(material).substring(0, 32),
                    Instant.now().plusSeconds(300));
            tokens.put(bank, token);
        }
        return token.value();
    }

    private BankProcessResponse failure(String code, String message) {
        return BankProcessResponse.builder().success(false).errorCode(code).errorMessage(message).build();
    }

    private BankReversalResponse reversalFailure(String code, String message) {
        return BankReversalResponse.builder().success(false).errorCode(code).errorMessage(message).build();
    }

    private SandboxBank resolve(String bankCode) {
        return SandboxBank.fromCode(bankCode == null || bankCode.isBlank() ? properties.getDefaultBank() : bankCode);
    }

    private String id(SandboxBank bank, String type, String operationId) {
        String material = operationId == null || operationId.isBlank() ? UUID.randomUUID().toString() : operationId;
        return bank.idPrefix() + "_" + type + "_" + sha256(bank.name() + ":" + type + ":" + material).substring(0, 20);
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
