package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.*;
import com.gateway.application.service.LedgerService;
import com.gateway.application.service.PaymentIntentService;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Tag(name = "Payment Intents API", description = "Core APIs for creating and confirming transactions (Stripe Compatible)")
@SecurityRequirement(name = "bearerAuth")
public class PaymentIntentController {

    private final PaymentIntentService paymentIntentService;
    private final PaymentIntentRepository paymentIntentRepository;
    private final LedgerService ledgerService;

    @PostMapping("/payment_intents")
    @Operation(summary = "Create a PaymentIntent with optional Idempotency-Key")
    public ResponseEntity<PaymentIntentResponse> createPaymentIntent(
            Authentication authentication,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreatePaymentIntentRequest request) {

        UUID merchantId = (UUID) authentication.getPrincipal();
        PaymentIntentResponse response = paymentIntentService.createPaymentIntent(merchantId, idempotencyKey, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/payment_intents/{id}/confirm")
    @Operation(summary = "Confirm a PaymentIntent to execute transaction")
    public ResponseEntity<PaymentIntentResponse> confirmPaymentIntent(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestBody ConfirmPaymentRequest request) {

        UUID merchantId = (UUID) authentication.getPrincipal();
        paymentIntentRepository.findById(id)
                .filter(intent -> intent.getMerchantId().equals(merchantId))
                .orElseThrow(() -> new IllegalArgumentException("PaymentIntent not found: " + id));
        PaymentIntentResponse response = paymentIntentService.confirmPaymentIntent(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payment_intents/{id}")
    @Operation(summary = "Retrieve a PaymentIntent by ID")
    public ResponseEntity<PaymentIntentEntity> getPaymentIntent(
            Authentication authentication,
            @PathVariable UUID id) {

        UUID merchantId = (UUID) authentication.getPrincipal();
        return paymentIntentRepository.findById(id)
                .filter(intent -> intent.getMerchantId().equals(merchantId))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/balance")
    @Operation(summary = "Get Merchant Ledger Balance (Double-Entry calculation)")
    public ResponseEntity<Map<String, Object>> getMerchantBalance(Authentication authentication) {
        UUID merchantId = (UUID) authentication.getPrincipal();
        long availableBalance = ledgerService.getMerchantAvailableBalance(merchantId);

        return ResponseEntity.ok(Map.of(
                "object", "balance",
                "merchant_id", merchantId.toString(),
                "currency", "VND",
                "available_balance", availableBalance
        ));
    }
}
