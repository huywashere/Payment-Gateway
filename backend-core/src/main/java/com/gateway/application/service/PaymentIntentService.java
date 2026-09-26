package com.gateway.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.*;
import com.gateway.domain.model.payment.PaymentIntentStatus;
import com.gateway.infrastructure.adapter.persistence.entity.*;
import com.gateway.infrastructure.adapter.persistence.repository.*;
import com.gateway.infrastructure.adapter.processor.BankProcessor;
import com.gateway.infrastructure.adapter.redis.IdempotencyManager;
import com.gateway.infrastructure.adapter.security.AesGcmVaultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentIntentService {

    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final ChargeRepository chargeRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final BankProcessor bankProcessor;
    private final LedgerService ledgerService;
    private final AesGcmVaultService vaultService;
    private final IdempotencyManager idempotencyManager;
    private final ObjectMapper objectMapper;

    /**
     * Create a new PaymentIntent with idempotency guard.
     */
    public PaymentIntentResponse createPaymentIntent(UUID merchantId, String idempotencyKey, CreatePaymentIntentRequest request) {
        return idempotencyManager.execute(merchantId, idempotencyKey, PaymentIntentResponse.class, () ->
                executeCreatePaymentIntent(merchantId, idempotencyKey, request));
    }

    @Transactional
    public PaymentIntentResponse executeCreatePaymentIntent(UUID merchantId, String idempotencyKey, CreatePaymentIntentRequest request) {
        log.info("Creating PaymentIntent for merchant: {}, amount: {} {}", merchantId, request.getAmount(), request.getCurrency());

        UUID intentId = UUID.randomUUID();
        String clientSecret = "pi_" + intentId.toString().replace("-", "") + "_secret_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        String metadataJson = null;
        if (request.getMetadata() != null) {
            try {
                metadataJson = objectMapper.writeValueAsString(request.getMetadata());
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize metadata", e);
            }
        }

        PaymentIntentEntity entity = PaymentIntentEntity.builder()
                .id(intentId)
                .merchantId(merchantId)
                .amount(request.getAmount())
                .currency(request.getCurrency())
                .status(PaymentIntentStatus.REQUIRES_PAYMENT_METHOD)
                .clientSecret(clientSecret)
                .idempotencyKey(idempotencyKey)
                .description(request.getDescription())
                .metadata(metadataJson)
                .build();

        PaymentIntentEntity saved = paymentIntentRepository.save(entity);

        return mapToResponse(saved, null, null);
    }

    /**
     * Confirm a PaymentIntent and execute payment processing.
     */
    @Transactional
    public PaymentIntentResponse confirmPaymentIntent(UUID paymentIntentId, ConfirmPaymentRequest request) {
        PaymentIntentEntity intent = paymentIntentRepository.findById(paymentIntentId)
                .orElseThrow(() -> new IllegalArgumentException("PaymentIntent not found: " + paymentIntentId));

        if (intent.getStatus().isTerminal()) {
            throw new IllegalStateException("PaymentIntent is already in terminal state: " + intent.getStatus());
        }

        intent.setStatus(PaymentIntentStatus.PROCESSING);

        // 1. Process payment method (Vault Tokenization)
        PaymentMethodEntity paymentMethod = null;
        String rawCardNumber = null;
        String cardHolder = null;
        Integer expM = null;
        Integer expY = null;
        String cvv = null;

        if (request.getCard() != null) {
            CardPayload card = request.getCard();
            rawCardNumber = card.getNumber();
            cardHolder = card.getHolderName();
            expM = card.getExpMonth();
            expY = card.getExpYear();
            cvv = card.getCvc();

            String cleanCard = rawCardNumber.replace(" ", "").replace("-", "");
            String last4 = cleanCard.length() >= 4 ? cleanCard.substring(cleanCard.length() - 4) : "0000";
            String brand = cleanCard.startsWith("4") ? "VISA" : cleanCard.startsWith("5") ? "MASTERCARD" : "UNKNOWN";

            // Encrypt card data inside PCI Card Vault using AES-256-GCM
            String sensitiveCardPayload = String.format("{\"number\":\"%s\",\"cvv\":\"%s\",\"holder\":\"%s\"}", cleanCard, cvv, cardHolder);
            String encryptedData = vaultService.encrypt(sensitiveCardPayload);
            String vaultToken = vaultService.generateVaultToken();

            paymentMethod = PaymentMethodEntity.builder()
                    .merchantId(intent.getMerchantId())
                    .customerId(intent.getCustomerId())
                    .type("CARD")
                    .cardBrand(brand)
                    .cardLast4(last4)
                    .cardExpMonth(expM)
                    .cardExpYear(expY)
                    .vaultToken(vaultToken)
                    .encryptedCardData(encryptedData)
                    .build();

            paymentMethod = paymentMethodRepository.save(paymentMethod);
            intent.setPaymentMethodId(paymentMethod.getId());
        } else if (request.getPaymentMethodId() != null) {
            paymentMethod = paymentMethodRepository.findByVaultToken(request.getPaymentMethodId())
                    .orElseThrow(() -> new IllegalArgumentException("Payment method token not found"));
            intent.setPaymentMethodId(paymentMethod.getId());
            // Decrypt card info for processor
            try {
                String decrypted = vaultService.decrypt(paymentMethod.getEncryptedCardData());
                Map<String, String> cardMap = objectMapper.readValue(decrypted, Map.class);
                rawCardNumber = cardMap.get("number");
                cvv = cardMap.get("cvv");
                cardHolder = cardMap.get("holder");
                expM = paymentMethod.getCardExpMonth();
                expY = paymentMethod.getCardExpYear();
            } catch (Exception e) {
                log.error("Failed to decrypt card token", e);
            }
        }

        // 2. Call Bank Processor
        BankProcessor.BankProcessResponse processResult = bankProcessor.processPayment(
                BankProcessor.BankProcessRequest.builder()
                        .rawCardNumber(rawCardNumber)
                        .cardHolderName(cardHolder)
                        .expMonth(expM)
                        .expYear(expY)
                        .cvv(cvv)
                        .amount(intent.getAmount())
                        .currency(intent.getCurrency())
                        .orderDescription(intent.getDescription())
                        .build()
        );

        String failureMessage = null;
        String nextActionUrl = null;

        if (processResult.isSuccess()) {
            intent.setStatus(PaymentIntentStatus.SUCCEEDED);

            // Calculate fees & create Charge
            long fee = ledgerService.calculateFee(intent.getAmount());
            ChargeEntity charge = ChargeEntity.builder()
                    .paymentIntentId(intent.getId())
                    .merchantId(intent.getMerchantId())
                    .amount(intent.getAmount())
                    .feeAmount(fee)
                    .currency(intent.getCurrency())
                    .processorTxId(processResult.getProcessorTransactionId())
                    .processorCode("MOCK_BANK")
                    .status("SUCCEEDED")
                    .build();
            chargeRepository.save(charge);

            // Atomic Double-Entry Ledger Booking
            ledgerService.recordPaymentSucceeded(charge);

            // Save Outbox Event for reliable Webhook
            saveOutboxEvent(intent, "payment_intent.succeeded");

        } else if (processResult.isRequiresAction()) {
            intent.setStatus(PaymentIntentStatus.REQUIRES_ACTION);
            nextActionUrl = processResult.getActionUrl();
        } else {
            intent.setStatus(PaymentIntentStatus.FAILED);
            failureMessage = processResult.getErrorMessage();

            ChargeEntity charge = ChargeEntity.builder()
                    .paymentIntentId(intent.getId())
                    .merchantId(intent.getMerchantId())
                    .amount(intent.getAmount())
                    .currency(intent.getCurrency())
                    .processorCode("MOCK_BANK")
                    .status("FAILED")
                    .failureMessage(failureMessage)
                    .build();
            chargeRepository.save(charge);

            saveOutboxEvent(intent, "payment_intent.payment_failed");
        }

        paymentIntentRepository.save(intent);

        return mapToResponse(intent, nextActionUrl, failureMessage);
    }

    private void saveOutboxEvent(PaymentIntentEntity intent, String eventType) {
        try {
            Map<String, Object> payloadMap = Map.of(
                    "id", intent.getId().toString(),
                    "object", "payment_intent",
                    "amount", intent.getAmount(),
                    "currency", intent.getCurrency(),
                    "status", intent.getStatus().name().toLowerCase(),
                    "merchant_id", intent.getMerchantId().toString()
            );

            OutboxEventEntity outboxEvent = OutboxEventEntity.builder()
                    .aggregateType("PAYMENT_INTENT")
                    .aggregateId(intent.getId())
                    .eventType(eventType)
                    .payload(objectMapper.writeValueAsString(payloadMap))
                    .status("PENDING")
                    .build();

            outboxEventRepository.save(outboxEvent);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize outbox event payload", e);
        }
    }

    private PaymentIntentResponse mapToResponse(PaymentIntentEntity entity, String nextActionUrl, String failureMessage) {
        Map<String, Object> metadata = null;
        if (entity.getMetadata() != null) {
            try {
                metadata = objectMapper.readValue(entity.getMetadata(), Map.class);
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse metadata JSON", e);
            }
        }

        return PaymentIntentResponse.builder()
                .id(entity.getId())
                .object("payment_intent")
                .amount(entity.getAmount())
                .currency(entity.getCurrency())
                .status(entity.getStatus())
                .clientSecret(entity.getClientSecret())
                .description(entity.getDescription())
                .nextActionUrl(nextActionUrl)
                .failureMessage(failureMessage)
                .metadata(metadata)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
