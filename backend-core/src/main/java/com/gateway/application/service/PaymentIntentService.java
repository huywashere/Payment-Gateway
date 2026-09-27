package com.gateway.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.*;
import com.gateway.domain.exception.IdempotencyConflictException;
import com.gateway.domain.model.payment.PaymentIntentStatus;
import com.gateway.infrastructure.adapter.persistence.entity.*;
import com.gateway.infrastructure.adapter.persistence.repository.*;
import com.gateway.infrastructure.adapter.processor.BankProcessor;
import com.gateway.infrastructure.adapter.redis.IdempotencyManager;
import com.gateway.infrastructure.adapter.security.PaymentMetadataVault;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import io.micrometer.core.instrument.MeterRegistry;

import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentIntentService {
    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final CustomerRepository customerRepository;
    private final ChargeRepository chargeRepository;
    private final BankProcessor bankProcessor;
    private final LedgerService ledgerService;
    private final OutboxService outboxService;
    private final AuditService auditService;
    private final PaymentMetadataVault vaultService;
    private final IdempotencyManager idempotencyManager;
    private final ObjectMapper objectMapper;
    private final RiskService riskService;
    private final MeterRegistry meterRegistry;

    @Value("${gateway.mode:sandbox}")
    private String gatewayMode;

    @Transactional
    public PaymentIntentResponse createPaymentIntent(UUID merchantId, String idempotencyKey,
                                                     CreatePaymentIntentRequest request) {
        String requestHash = idempotencyManager.fingerprint(request);
        return idempotencyManager.execute(merchantId, idempotencyKey, requestHash,
                PaymentIntentResponse.class,
                () -> executeCreatePaymentIntent(merchantId, idempotencyKey, requestHash, request));
    }

    private PaymentIntentResponse executeCreatePaymentIntent(UUID merchantId, String idempotencyKey,
                                                              String requestHash, CreatePaymentIntentRequest request) {
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            PaymentIntentEntity existing = paymentIntentRepository
                    .findByIdempotencyKeyAndMerchantId(idempotencyKey, merchantId).orElse(null);
            if (existing != null) {
                if (existing.getRequestHash() != null && !existing.getRequestHash().equals(requestHash)) {
                    throw new IdempotencyConflictException("The Idempotency-Key was already used with different parameters.");
                }
                return mapToResponse(existing, null, existing.getLastErrorCode(), null);
            }
        }
        String clientSecret = "pi_" + randomToken(24) + "_secret_" + randomToken(18);
        UUID customerId = createCustomerIfPresent(merchantId, request);
        PaymentIntentEntity saved = paymentIntentRepository.save(PaymentIntentEntity.builder()
                .merchantId(merchantId).customerId(customerId).amount(request.getAmount())
                .currency(request.getCurrency().toUpperCase(Locale.ROOT))
                .status(PaymentIntentStatus.REQUIRES_PAYMENT_METHOD).clientSecret(clientSecret)
                .idempotencyKey(idempotencyKey).requestHash(requestHash).description(request.getDescription())
                .metadata(writeJson(request.getMetadata())).build());
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "payment_intent.created",
                "payment_intent", saved.getId().toString(), Map.of("amount", saved.getAmount(), "currency", saved.getCurrency()));
        return mapToResponse(saved, null, null, null);
    }

    @Transactional
    public PaymentIntentResponse confirmPaymentIntent(UUID merchantId, UUID paymentIntentId,
                                                      String idempotencyKey, ConfirmPaymentRequest request) {
        String fingerprint = idempotencyManager.fingerprint(Map.of("payment_intent", paymentIntentId, "request", request));
        // The intent-specific operation key prevents double processing even if callers send different keys.
        return idempotencyManager.execute(merchantId, "confirm:" + paymentIntentId, fingerprint,
                PaymentIntentResponse.class,
                () -> executeConfirm(merchantId, paymentIntentId, request));
    }

    @Transactional
    public PaymentIntentResponse confirmPaymentIntent(UUID paymentIntentId, ConfirmPaymentRequest request) {
        PaymentIntentEntity intent = paymentIntentRepository.findById(paymentIntentId)
                .orElseThrow(() -> new IllegalArgumentException("PaymentIntent not found: " + paymentIntentId));
        return confirmPaymentIntent(intent.getMerchantId(), paymentIntentId, null, request);
    }

    private PaymentIntentResponse executeConfirm(UUID merchantId, UUID paymentIntentId, ConfirmPaymentRequest request) {
        PaymentIntentEntity intent = ownedIntent(merchantId, paymentIntentId);
        if (intent.getStatus().isTerminal()) {
            throw new IllegalStateException("PaymentIntent is already in terminal state: " + intent.getStatus());
        }
        if (intent.getStatus() == PaymentIntentStatus.PROCESSING) {
            throw new IllegalStateException("PaymentIntent is already being processed");
        }
        RiskService.RiskDecision risk = riskService.evaluate(intent);
        if ("BLOCK".equals(risk.decision())) {
            meterRegistry.counter("gateway_payment_outcomes_total", "outcome", "risk_blocked").increment();
            intent.setStatus(PaymentIntentStatus.FAILED);
            intent.setLastErrorCode("risk_blocked");
            paymentIntentRepository.save(intent);
            outboxService.enqueue(merchantId, "PAYMENT_INTENT", intent.getId(), "payment_intent.payment_failed",
                    paymentEventData(intent));
            auditService.record(merchantId, "RISK_ENGINE", "rules-v1", "payment_intent.blocked",
                    "payment_intent", intent.getId().toString(), Map.of("score", risk.score(), "reasons", risk.reasons()));
            return mapToResponse(intent, null, "risk_blocked",
                    "The payment was blocked by the merchant risk policy");
        }
        intent.setStatus(PaymentIntentStatus.PROCESSING);
        intent.setLastErrorCode(null);

        PaymentMaterial material = preparePaymentMethod(intent, request);
        BankProcessor.BankProcessResponse result = bankProcessor.processPayment(
                BankProcessor.BankProcessRequest.builder()
                        .operationId(intent.getId().toString())
                        .processorPaymentMethodToken(material.processorToken())
                        .rawCardNumber(material.rawCardNumber()).cardHolderName(material.holderName())
                        .expMonth(material.expMonth()).expYear(material.expYear()).cvv(material.cvc())
                        .paymentMethodType(material.type()).scenario(material.scenario())
                        .amount(intent.getAmount()).currency(intent.getCurrency())
                        .orderDescription(intent.getDescription()).build());

        String failureMessage = null;
        String nextActionUrl = null;
        ChargeEntity charge = null;
        if (result.isSuccess()) {
            meterRegistry.counter("gateway_payment_outcomes_total", "outcome", "succeeded").increment();
            charge = captureSuccessfulPayment(intent, material.paymentMethod(), result.getProcessorTransactionId(), material.type());
        } else if (result.isRequiresAction()) {
            meterRegistry.counter("gateway_payment_outcomes_total", "outcome", "requires_action").increment();
            intent.setStatus(PaymentIntentStatus.REQUIRES_ACTION);
            nextActionUrl = result.getActionUrl();
            charge = chargeRepository.save(ChargeEntity.builder()
                    .paymentIntentId(intent.getId()).merchantId(merchantId)
                    .paymentMethodId(material.paymentMethod() == null ? null : material.paymentMethod().getId())
                    .amount(intent.getAmount()).feeAmount(ledgerService.calculateFee(intent.getAmount()))
                    .currency(intent.getCurrency()).processorTxId(result.getProcessorTransactionId())
                    .processorCode(bankProcessor.processorCode(material.type())).status("PENDING").build());
            outboxService.enqueue(merchantId, "PAYMENT_INTENT", intent.getId(), "payment_intent.requires_action",
                    paymentEventData(intent));
        } else {
            meterRegistry.counter("gateway_payment_outcomes_total", "outcome", "processor_failed").increment();
            intent.setStatus(PaymentIntentStatus.FAILED);
            intent.setLastErrorCode(result.getErrorCode());
            failureMessage = result.getErrorMessage();
            charge = chargeRepository.save(ChargeEntity.builder()
                    .paymentIntentId(intent.getId()).merchantId(merchantId)
                    .paymentMethodId(material.paymentMethod() == null ? null : material.paymentMethod().getId())
                    .amount(intent.getAmount()).currency(intent.getCurrency())
                    .processorCode(bankProcessor.processorCode(material.type()))
                    .status("FAILED").failureMessage(failureMessage).build());
            outboxService.enqueue(merchantId, "PAYMENT_INTENT", intent.getId(), "payment_intent.payment_failed",
                    paymentEventData(intent));
        }
        paymentIntentRepository.save(intent);
        auditService.record(merchantId, "CHECKOUT", merchantId.toString(), "payment_intent.confirmed",
                "payment_intent", intent.getId().toString(), Map.of("status", intent.getStatus().name(), "method", material.type()));
        return mapToResponse(intent, nextActionUrl, result.getErrorCode(), failureMessage,
                charge == null ? null : charge.getId());
    }

    @Transactional
    public PaymentIntentResponse completeRequiredAction(String clientSecret, boolean success) {
        PaymentIntentEntity intent = paymentIntentRepository.findByClientSecret(clientSecret)
                .orElseThrow(() -> new IllegalArgumentException("Invalid client secret"));
        if (intent.getStatus() != PaymentIntentStatus.REQUIRES_ACTION) {
            throw new IllegalStateException("PaymentIntent does not require an action");
        }
        if (!success) {
            intent.setStatus(PaymentIntentStatus.FAILED);
            intent.setLastErrorCode("authentication_failed");
            paymentIntentRepository.save(intent);
            outboxService.enqueue(intent.getMerchantId(), "PAYMENT_INTENT", intent.getId(),
                    "payment_intent.payment_failed", paymentEventData(intent));
            return mapToResponse(intent, null, "authentication_failed", "Sandbox authentication failed");
        }
        PaymentMethodEntity method = intent.getPaymentMethodId() == null ? null
                : paymentMethodRepository.findById(intent.getPaymentMethodId()).orElse(null);
        ChargeEntity charge = captureSuccessfulPayment(intent, method,
                "bank_3ds_" + randomToken(16), "CARD");
        paymentIntentRepository.save(intent);
        return mapToResponse(intent, null, null, null, charge.getId());
    }

    @Transactional
    public PaymentIntentResponse cancel(UUID merchantId, UUID paymentIntentId) {
        PaymentIntentEntity intent = ownedIntent(merchantId, paymentIntentId);
        if (intent.getStatus().isTerminal()) throw new IllegalStateException("A terminal PaymentIntent cannot be canceled");
        intent.setStatus(PaymentIntentStatus.CANCELED);
        intent.setCanceledAt(OffsetDateTime.now());
        paymentIntentRepository.save(intent);
        outboxService.enqueue(merchantId, "PAYMENT_INTENT", intent.getId(), "payment_intent.canceled", paymentEventData(intent));
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "payment_intent.canceled",
                "payment_intent", intent.getId().toString(), null);
        return mapToResponse(intent, null, null, null);
    }

    @Transactional
    public PaymentIntentResponse confirmSandbox(String clientSecret, SandboxCheckoutRequest request) {
        PaymentIntentEntity intent = paymentIntentRepository.findByClientSecret(clientSecret)
                .orElseThrow(() -> new IllegalArgumentException("Invalid client secret"));
        ConfirmPaymentRequest confirm = ConfirmPaymentRequest.builder()
                .paymentMethodType(request.getPaymentMethodType().toUpperCase(Locale.ROOT))
                .scenario(request.getScenario()).returnUrl(request.getReturnUrl()).build();
        return confirmPaymentIntent(intent.getMerchantId(), intent.getId(), null, confirm);
    }

    private ChargeEntity captureSuccessfulPayment(PaymentIntentEntity intent, PaymentMethodEntity paymentMethod,
                                                  String processorTransactionId, String methodType) {
        intent.setStatus(PaymentIntentStatus.SUCCEEDED);
        long fee = ledgerService.calculateFee(intent.getAmount());
        ChargeEntity charge = chargeRepository.findByPaymentIntentId(intent.getId()).stream()
                .filter(candidate -> "PENDING".equals(candidate.getStatus()))
                .findFirst().orElseGet(() -> ChargeEntity.builder()
                        .paymentIntentId(intent.getId()).merchantId(intent.getMerchantId()).build());
        charge.setPaymentMethodId(paymentMethod == null ? null : paymentMethod.getId());
        charge.setAmount(intent.getAmount());
        charge.setFeeAmount(fee);
        charge.setCurrency(intent.getCurrency());
        if (charge.getProcessorTxId() == null) charge.setProcessorTxId(processorTransactionId);
        charge.setProcessorCode(bankProcessor.processorCode(methodType));
        charge.setStatus("SUCCEEDED");
        charge = chargeRepository.save(charge);
        ledgerService.recordPaymentSucceeded(charge);
        outboxService.enqueue(intent.getMerchantId(), "PAYMENT_INTENT", intent.getId(),
                "payment_intent.succeeded", paymentEventData(intent));
        return charge;
    }

    private PaymentMaterial preparePaymentMethod(PaymentIntentEntity intent, ConfirmPaymentRequest request) {
        String type = request.getPaymentMethodType() == null ? "CARD" : request.getPaymentMethodType().toUpperCase(Locale.ROOT);
        String scenario = request.getScenario() == null ? "success" : request.getScenario().toLowerCase(Locale.ROOT);
        if ("live".equalsIgnoreCase(gatewayMode)
                && (request.getCard() != null || request.getPaymentMethodId() == null)) {
            throw new IllegalArgumentException(
                    "Live payments require an opaque processor payment-method token; raw card data is prohibited");
        }
        if ("VIETQR".equals(type)) {
            PaymentMethodEntity method = createSandboxMethod(intent, "VIETQR", "N/A", null, null, scenario, null);
            return new PaymentMaterial(method, type, scenario, method.getProcessorToken(), null, null, null, null, null);
        }
        if ("CARD".equals(type) && request.getCard() == null && request.getPaymentMethodId() == null
                && request.getScenario() != null) {
            PaymentMethodEntity method = createSandboxMethod(intent, "CARD", "4242", 12,
                    OffsetDateTime.now().getYear() + 3, scenario, "SANDBOX USER");
            return new PaymentMaterial(method, type, scenario, method.getProcessorToken(), null, "SANDBOX USER",
                    method.getCardExpMonth(), method.getCardExpYear(), null);
        }
        if (request.getCard() != null) {
            CardPayload card = request.getCard();
            String number = card.getNumber() == null ? "" : card.getNumber().replaceAll("[ -]", "");
            validateCard(card, number);
            scenario = inferScenario(number, scenario);
            String last4 = number.substring(number.length() - 4);
            String brand = number.startsWith("4") ? "VISA" : number.startsWith("5") ? "MASTERCARD" : "UNKNOWN";
            PaymentMethodEntity method = createSandboxMethod(intent, "CARD", last4, card.getExpMonth(),
                    card.getExpYear(), scenario, card.getHolderName());
            return new PaymentMaterial(method, "CARD", scenario, method.getProcessorToken(), number, card.getHolderName(),
                    card.getExpMonth(), card.getExpYear(), card.getCvc());
        }
        if (request.getPaymentMethodId() != null) {
            PaymentMethodEntity method = paymentMethodRepository.findByVaultToken(request.getPaymentMethodId())
                    .filter(candidate -> candidate.getMerchantId().equals(intent.getMerchantId()))
                    .orElseThrow(() -> new IllegalArgumentException("Payment method token not found"));
            try {
                @SuppressWarnings("unchecked") Map<String, String> stored = objectMapper.readValue(
                        vaultService.decrypt(method.getEncryptedMetadata()), Map.class);
                scenario = stored.getOrDefault("scenario", "success");
                return new PaymentMaterial(method, method.getType(), scenario, method.getProcessorToken(), null, stored.get("holder"),
                        method.getCardExpMonth(), method.getCardExpYear(), null);
            } catch (Exception e) {
                throw new IllegalStateException("Payment method token could not be opened");
            }
        }
        throw new IllegalArgumentException("A card, payment method token, or sandbox payment method type is required");
    }

    private PaymentMethodEntity createSandboxMethod(PaymentIntentEntity intent, String type, String last4,
                                                     Integer expMonth, Integer expYear, String scenario, String holder) {
        String brand = "CARD".equals(type) ? "SANDBOX" : "VIETQR";
        String encrypted = vaultService.encrypt(writeJson(Map.of(
                "scenario", scenario,
                "holder", holder == null ? "SANDBOX USER" : holder,
                "sandbox", true)));
        PaymentMethodEntity method = paymentMethodRepository.save(PaymentMethodEntity.builder()
                .merchantId(intent.getMerchantId()).customerId(intent.getCustomerId()).type(type)
                .cardBrand(brand).cardLast4(last4).cardExpMonth(expMonth).cardExpYear(expYear)
                .vaultToken("pm_" + type.toLowerCase(Locale.ROOT) + "_" + randomToken(24))
                .processorToken("sandbox_" + type.toLowerCase(Locale.ROOT) + "_" + randomToken(24))
                .encryptedMetadata(encrypted).build());
        intent.setPaymentMethodId(method.getId());
        return method;
    }

    private void validateCard(CardPayload card, String number) {
        if (!number.matches("\\d{13,19}")) throw new IllegalArgumentException("Invalid sandbox card number");
        if (card.getExpMonth() == null || card.getExpMonth() < 1 || card.getExpMonth() > 12) {
            throw new IllegalArgumentException("Invalid card expiry month");
        }
        if (card.getExpYear() == null || card.getExpYear() < OffsetDateTime.now().getYear()) {
            throw new IllegalArgumentException("Card is expired");
        }
        if (card.getCvc() == null || !card.getCvc().matches("\\d{3,4}")) throw new IllegalArgumentException("Invalid card CVC");
    }

    private String inferScenario(String number, String explicit) {
        if (!"success".equals(explicit)) return explicit;
        if (number.endsWith("0002")) return "insufficient_funds";
        if (number.endsWith("0005")) return "declined";
        if (number.endsWith("3000")) return "requires_action";
        return "success";
    }

    private UUID createCustomerIfPresent(UUID merchantId, CreatePaymentIntentRequest request) {
        if ((request.getCustomerEmail() == null || request.getCustomerEmail().isBlank())
                && (request.getCustomerName() == null || request.getCustomerName().isBlank())) return null;
        Map<String, String> pii = new LinkedHashMap<>();
        if (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()) {
            pii.put("email", request.getCustomerEmail().trim().toLowerCase(Locale.ROOT));
        }
        if (request.getCustomerName() != null && !request.getCustomerName().isBlank()) {
            pii.put("name", request.getCustomerName().trim());
        }
        String emailDomain = request.getCustomerEmail() != null && request.getCustomerEmail().contains("@")
                ? request.getCustomerEmail().substring(request.getCustomerEmail().lastIndexOf('@') + 1)
                    .trim().toLowerCase(Locale.ROOT)
                : null;
        return customerRepository.save(CustomerEntity.builder().merchantId(merchantId)
                .emailDomain(emailDomain).encryptedPii(vaultService.encrypt(writeJson(pii))).build()).getId();
    }

    private PaymentIntentEntity ownedIntent(UUID merchantId, UUID paymentIntentId) {
        return paymentIntentRepository.findById(paymentIntentId)
                .filter(intent -> intent.getMerchantId().equals(merchantId))
                .orElseThrow(() -> new IllegalArgumentException("PaymentIntent not found: " + paymentIntentId));
    }

    private Map<String, Object> paymentEventData(PaymentIntentEntity intent) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", intent.getId().toString());
        data.put("object", "payment_intent");
        data.put("amount", intent.getAmount());
        data.put("currency", intent.getCurrency());
        data.put("status", intent.getStatus().name().toLowerCase(Locale.ROOT));
        data.put("merchant_id", intent.getMerchantId().toString());
        return data;
    }

    private PaymentIntentResponse mapToResponse(PaymentIntentEntity entity, String nextActionUrl,
                                                String failureCode, String failureMessage) {
        return mapToResponse(entity, nextActionUrl, failureCode, failureMessage, latestChargeId(entity.getId()));
    }

    private PaymentIntentResponse mapToResponse(PaymentIntentEntity entity, String nextActionUrl,
                                                String failureCode, String failureMessage, UUID chargeId) {
        Map<String, Object> metadata = null;
        if (entity.getMetadata() != null) {
            try { metadata = objectMapper.readValue(entity.getMetadata(), Map.class); }
            catch (JsonProcessingException ignored) { metadata = Map.of(); }
        }
        return PaymentIntentResponse.builder().id(entity.getId()).object("payment_intent")
                .amount(entity.getAmount()).currency(entity.getCurrency()).status(entity.getStatus())
                .clientSecret(entity.getClientSecret()).description(entity.getDescription())
                .nextActionUrl(nextActionUrl).failureCode(failureCode).failureMessage(failureMessage)
                .latestChargeId(chargeId).metadata(metadata).createdAt(entity.getCreatedAt()).build();
    }

    private UUID latestChargeId(UUID intentId) {
        return chargeRepository.findByPaymentIntentId(intentId).stream()
                .max(Comparator.comparing(ChargeEntity::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder())))
                .map(ChargeEntity::getId).orElse(null);
    }

    private String writeJson(Object value) {
        if (value == null) return null;
        try { return objectMapper.writeValueAsString(value); }
        catch (JsonProcessingException e) { throw new IllegalArgumentException("Request contains invalid JSON metadata", e); }
    }

    private String randomToken(int length) {
        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        return token.substring(0, length);
    }

    private record PaymentMaterial(PaymentMethodEntity paymentMethod, String type, String scenario,
                                   String processorToken, String rawCardNumber, String holderName, Integer expMonth,
                                   Integer expYear, String cvc) {}
}
