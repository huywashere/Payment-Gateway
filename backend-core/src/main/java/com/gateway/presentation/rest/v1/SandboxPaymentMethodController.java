package com.gateway.presentation.rest.v1;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.CreateSandboxPaymentMethodRequest;
import com.gateway.application.dto.PaymentMethodResponse;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentMethodEntity;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentMethodRepository;
import com.gateway.infrastructure.adapter.security.AesGcmVaultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/v1/payment_methods")
@RequiredArgsConstructor
public class SandboxPaymentMethodController {
    private static final Set<String> TYPES = Set.of("CARD", "VIETQR");
    private static final Set<String> SCENARIOS = Set.of("success", "declined", "insufficient_funds", "requires_action", "timeout");
    private final PaymentMethodRepository repository;
    private final AesGcmVaultService vaultService;
    private final ObjectMapper objectMapper;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('SCOPE_payment_methods:write', 'SCOPE_payments:write', 'SCOPE_*')")
    public ResponseEntity<PaymentMethodResponse> create(Authentication authentication,
                                                        @Valid @RequestBody CreateSandboxPaymentMethodRequest request) throws Exception {
        String type = request.getType().toUpperCase(Locale.ROOT);
        String scenario = request.getScenario().toLowerCase(Locale.ROOT);
        if (!TYPES.contains(type)) throw new IllegalArgumentException("Unsupported sandbox payment method type");
        if (!SCENARIOS.contains(scenario)) throw new IllegalArgumentException("Unsupported sandbox scenario");
        String token = "pm_" + type.toLowerCase(Locale.ROOT) + "_" +
                UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        String payload = objectMapper.writeValueAsString(Map.of(
                "scenario", scenario,
                "holder", request.getHolderName() == null ? "SANDBOX USER" : request.getHolderName(),
                "sandbox", true));
        PaymentMethodEntity entity = repository.save(PaymentMethodEntity.builder()
                .merchantId((UUID) authentication.getPrincipal()).type(type).cardBrand(type)
                .cardLast4("CARD".equals(type) ? "4242" : "N/A")
                .vaultToken(token).encryptedCardData(vaultService.encrypt(payload)).build());
        return ResponseEntity.status(HttpStatus.CREATED).body(PaymentMethodResponse.builder()
                .id(entity.getVaultToken()).object("payment_method").type(type)
                .scenario(scenario).sandbox(true).createdAt(entity.getCreatedAt()).build());
    }
}
