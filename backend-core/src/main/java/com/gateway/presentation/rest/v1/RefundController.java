package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.CreateRefundRequest;
import com.gateway.application.dto.RefundResponse;
import com.gateway.application.service.RefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class RefundController {
    private final RefundService refundService;

    @PostMapping("/charges/{chargeId}/refunds")
    @PreAuthorize("hasAnyAuthority('SCOPE_refunds:write', 'SCOPE_*')")
    public ResponseEntity<RefundResponse> create(Authentication authentication, @PathVariable UUID chargeId,
                                                 @RequestHeader("Idempotency-Key") String idempotencyKey,
                                                 @Valid @RequestBody CreateRefundRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(refundService.create(
                (UUID) authentication.getPrincipal(), chargeId, idempotencyKey, request));
    }
}

