package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.CreateMerchantRequest;
import com.gateway.application.dto.MerchantOnboardingResponse;
import com.gateway.application.service.MerchantManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/platform/merchants")
@RequiredArgsConstructor
public class MerchantManagementController {
    private final MerchantManagementService service;

    @PostMapping
    public ResponseEntity<MerchantOnboardingResponse> onboard(@Valid @RequestBody CreateMerchantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.onboard(request));
    }
}

