package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.AcquirerOperationRequest;
import com.gateway.application.dto.AcquirerOperationResponse;
import com.gateway.application.service.AcquirerLifecycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/acquirer")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('SCOPE_payments:write', 'SCOPE_*')")
public class AcquirerController {
    private final AcquirerLifecycleService service;

    @PostMapping("/operations")
    @ResponseStatus(HttpStatus.CREATED)
    public AcquirerOperationResponse execute(Authentication authentication,
                                              @RequestHeader("Idempotency-Key") String idempotencyKey,
                                              @Valid @RequestBody AcquirerOperationRequest request) {
        return service.execute((UUID) authentication.getPrincipal(), idempotencyKey, request);
    }

    @GetMapping("/operations")
    public List<AcquirerOperationResponse> list(Authentication authentication,
                                                 @RequestParam UUID paymentIntentId) {
        return service.list((UUID) authentication.getPrincipal(), paymentIntentId);
    }

    @PostMapping("/operations/{id}/3ds")
    public AcquirerOperationResponse completeThreeDs(Authentication authentication, @PathVariable UUID id,
                                                      @RequestBody Map<String, Boolean> body) {
        return service.completeThreeDs((UUID) authentication.getPrincipal(), id,
                Boolean.TRUE.equals(body.get("successful")));
    }

    @GetMapping("/hosted-fields/config")
    public Map<String, Object> hostedFields() {
        return Map.of("mode", "sandbox", "tokenizationEndpoint", "/v1/payment_methods/sandbox/card",
                "allowedFields", List.of("cardNumber", "expiryMonth", "expiryYear", "cvc"),
                "rawCardDataMustNotReachMerchantServer", true, "threeDsVersions", List.of("2.1.0", "2.2.0"));
    }
}
