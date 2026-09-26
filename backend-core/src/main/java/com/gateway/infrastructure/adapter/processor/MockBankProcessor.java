package com.gateway.infrastructure.adapter.processor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class MockBankProcessor implements BankProcessor {

    @Override
    public BankProcessResponse processPayment(BankProcessRequest request) {
        String card = request.getRawCardNumber() != null
                ? request.getRawCardNumber().replace(" ", "").replace("-", "")
                : "";

        log.info("Mock Bank Processor receiving charge attempt for card ending in last4: {}",
                card.length() >= 4 ? card.substring(card.length() - 4) : "unknown");

        // Simulate 4242 4242 4242 4242 -> Success
        if (card.startsWith("4242")) {
            return BankProcessResponse.builder()
                    .success(true)
                    .processorTransactionId("bank_visa_" + UUID.randomUUID().toString().substring(0, 16))
                    .build();
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
            return BankProcessResponse.builder()
                    .success(false)
                    .requiresAction(true)
                    .actionUrl("/v1/checkout/3ds-verify?session=" + UUID.randomUUID())
                    .build();
        }

        // Default: If card format is at least 15-16 digits, succeed
        if (card.length() >= 15) {
            return BankProcessResponse.builder()
                    .success(true)
                    .processorTransactionId("bank_gen_" + UUID.randomUUID().toString().substring(0, 16))
                    .build();
        }

        return BankProcessResponse.builder()
                .success(false)
                .errorCode("invalid_card_number")
                .errorMessage("The card number provided is invalid.")
                .build();
    }
}
