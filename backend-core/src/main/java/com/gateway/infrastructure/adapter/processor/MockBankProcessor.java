package com.gateway.infrastructure.adapter.processor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@ConditionalOnProperty(name = "gateway.processor.mode", havingValue = "mock", matchIfMissing = true)
public class MockBankProcessor implements BankProcessor {
    @Override
    public BankProcessResponse processPayment(BankProcessRequest request) {
        return processNewPayment(request);
    }

    private BankProcessResponse processNewPayment(BankProcessRequest request) {
        String scenario = request.getScenario() == null ? "" : request.getScenario().toLowerCase();
        if ("insufficient_funds".equals(scenario)) {
            return failure("insufficient_funds", "The sandbox account has insufficient funds.");
        }
        if ("declined".equals(scenario)) {
            return failure("payment_declined", "The sandbox payment was declined.");
        }
        if ("requires_action".equals(scenario)) {
            String transactionId = id("auth", request.getOperationId());
            return BankProcessResponse.builder().requiresAction(true)
                    .processorTransactionId(transactionId)
                    .actionUrl("/sandbox/3ds?session=" + transactionId).build();
        }
        if ("timeout".equals(scenario)) {
            return failure("processor_timeout", "The sandbox processor timed out.");
        }
        if ("VIETQR".equalsIgnoreCase(request.getPaymentMethodType()) && "success".equals(scenario)) {
            return success("vietqr", request.getOperationId());
        }
        String card = request.getRawCardNumber() != null
                ? request.getRawCardNumber().replace(" ", "").replace("-", "")
                : "";

        log.info("Mock Bank Processor receiving charge attempt for card ending in last4: {}",
                card.length() >= 4 ? card.substring(card.length() - 4) : "unknown");

        // Simulate 4242 4242 4242 4242 -> Success
        if (card.startsWith("4242")) {
            return success("visa", request.getOperationId());
        }

        // Simulate 4000 0000 0000 0002 -> Insufficient funds
        if (card.endsWith("0002")) {
            return BankProcessResponse.builder()
                    .success(false)
                    .errorCode("insufficient_funds")
                    .errorMessage("The card has insufficient funds to complete the transaction.")
                    .build();
        }

        // Simulate 4000 0000 0000 0005 -> Card declined
        if (card.endsWith("0005")) {
            return BankProcessResponse.builder()
                    .success(false)
                    .errorCode("card_declined")
                    .errorMessage("The card was declined by the issuing bank.")
                    .build();
        }

        // Simulate 4000 0000 0000 3000 -> 3DS / OTP verification needed
        if (card.endsWith("3000")) {
            String transactionId = id("auth", request.getOperationId());
            return BankProcessResponse.builder()
                    .success(false)
                    .requiresAction(true)
                    .processorTransactionId(transactionId)
                    .actionUrl("/v1/checkout/3ds-verify?session=" + transactionId)
                    .build();
        }

        // Default: If card format is at least 15-16 digits, succeed
        if (card.length() >= 15) {
            return success("card", request.getOperationId());
        }

        return BankProcessResponse.builder()
                .success(false)
                .errorCode("invalid_card_number")
                .errorMessage("The card number provided is invalid.")
                .build();
    }

    private BankProcessResponse success(String method, String operationId) {
        return BankProcessResponse.builder().success(true)
                .processorTransactionId(id(method, operationId))
                .build();
    }

    private BankProcessResponse failure(String code, String message) {
        return BankProcessResponse.builder().success(false).errorCode(code).errorMessage(message).build();
    }

    @Override
    public BankReversalResponse reversePayment(BankReversalRequest request) {
        if (request.getProcessorTransactionId() == null || request.getAmount() == null || request.getAmount() <= 0) {
            return BankReversalResponse.builder().success(false).errorCode("invalid_reversal")
                    .errorMessage("A processor transaction and positive amount are required").build();
        }
        String operationId = request.getOperationId() == null || request.getOperationId().isBlank()
                ? request.getProcessorTransactionId() + ":" + request.getAmount()
                : request.getOperationId();
        String reversalId = "re_mock_" + sha256("reversal:" + operationId).substring(0, 20);
        return BankReversalResponse.builder().success(true).reversalId(reversalId).build();
    }

    private String id(String type, String operationId) {
        String material = operationId == null || operationId.isBlank()
                ? type + ":" + UUID.randomUUID()
                : type + ":" + operationId;
        return "bank_" + type + "_" + sha256(material).substring(0, 20);
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
