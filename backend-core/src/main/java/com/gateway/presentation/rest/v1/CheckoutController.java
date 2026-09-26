package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.CardPayload;
import com.gateway.application.dto.ConfirmPaymentRequest;
import com.gateway.application.dto.PaymentIntentResponse;
import com.gateway.application.service.PaymentIntentService;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/checkout")
@RequiredArgsConstructor
@Tag(name = "Hosted Checkout API", description = "Public endpoints used by Customer Checkout UI and Drop-in SDK")
public class CheckoutController {

    private final PaymentIntentRepository paymentIntentRepository;
    private final PaymentIntentService paymentIntentService;

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
                .build();

        PaymentIntentResponse response = paymentIntentService.confirmPaymentIntent(intent.getId(), request);
        return ResponseEntity.ok(response);
    }
}
