package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.CardPayload;
import com.gateway.application.dto.ConfirmPaymentRequest;
import com.gateway.application.dto.PaymentIntentResponse;
import com.gateway.application.dto.SandboxCheckoutRequest;
import com.gateway.application.service.PaymentIntentService;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/v1/checkout")
@RequiredArgsConstructor
@Tag(name = "Hosted Checkout API", description = "Public endpoints used by Customer Checkout UI and Drop-in SDK")
public class CheckoutController {

    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentIntentService paymentIntentService;

    @Value("${gateway.mode:sandbox}")
    private String gatewayMode;

    @GetMapping("/{clientSecret}")
    @Operation(summary = "Load session info for Checkout UI using Client Secret")
    public ResponseEntity<Map<String, Object>> getCheckoutSession(@PathVariable String clientSecret) {
        PaymentIntentEntity intent = paymentIntentRepository.findByClientSecret(clientSecret)
                .orElseThrow(() -> new IllegalArgumentException("Invalid client secret"));

        return ResponseEntity.ok(Map.of(
                "id", intent.getId(),
                "amount", intent.getAmount(),
                "currency", intent.getCurrency(),
                "status", intent.getStatus(),
                "description", intent.getDescription() != null ? intent.getDescription() : "Thanh toán đơn hàng"
        ));
    }

    @PostMapping("/{clientSecret}/pay")
    @Operation(summary = "Submit payment from Checkout UI")
    public ResponseEntity<PaymentIntentResponse> submitPayment(
            @PathVariable String clientSecret,
            @RequestBody CardPayload cardPayload) {

        PaymentIntentEntity intent = paymentIntentRepository.findByClientSecret(clientSecret)
                .orElseThrow(() -> new IllegalArgumentException("Invalid client secret"));

        ConfirmPaymentRequest request = ConfirmPaymentRequest.builder()
                .card(cardPayload)
                .bankCode(cardPayload.getBankCode())
                .build();

        PaymentIntentResponse response = paymentIntentService.confirmPaymentIntent(intent.getId(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{clientSecret}/sandbox/complete")
    @Operation(summary = "Complete a sandbox Card or VietQR payment")
    public ResponseEntity<PaymentIntentResponse> completeSandboxPayment(
            @PathVariable String clientSecret,
            @Valid @RequestBody SandboxCheckoutRequest request) {
        ensureSandbox();
        return ResponseEntity.ok(paymentIntentService.confirmSandbox(clientSecret, request));
    }

    @PostMapping("/{clientSecret}/sandbox/action")
    @Operation(summary = "Complete a sandbox 3DS action")
    public ResponseEntity<PaymentIntentResponse> completeSandboxAction(
            @PathVariable String clientSecret,
            @RequestBody Map<String, Boolean> request) {
        ensureSandbox();
        return ResponseEntity.ok(paymentIntentService.completeRequiredAction(
                clientSecret, Boolean.TRUE.equals(request.get("success"))));
    }

    private void ensureSandbox() {
        if (!"sandbox".equalsIgnoreCase(gatewayMode)) {
            throw new IllegalStateException("Sandbox checkout endpoints are disabled in live mode");
        }
    }
}
