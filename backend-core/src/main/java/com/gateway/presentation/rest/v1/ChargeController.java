package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.ChargeResponse;
import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import com.gateway.infrastructure.adapter.persistence.repository.ChargeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/charges")
@RequiredArgsConstructor
public class ChargeController {
    private final ChargeRepository repository;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('SCOPE_payments:read', 'SCOPE_*')")
    public ChargeResponse get(Authentication authentication, @PathVariable UUID id) {
        ChargeEntity charge = repository.findByIdAndMerchantId(id, (UUID) authentication.getPrincipal())
                .orElseThrow(() -> new IllegalArgumentException("Charge not found"));
        return ChargeResponse.builder().id(charge.getId()).object("charge")
                .paymentIntentId(charge.getPaymentIntentId()).amount(charge.getAmount())
                .feeAmount(charge.getFeeAmount()).currency(charge.getCurrency()).status(charge.getStatus())
                .processorCode(charge.getProcessorCode()).processorTransactionId(charge.getProcessorTxId())
                .createdAt(charge.getCreatedAt()).build();
    }
}
