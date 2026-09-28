package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.CreateMerchantRequest;
import com.gateway.application.dto.MerchantOnboardingResponse;
import com.gateway.application.dto.PlatformMerchantResponse;
import com.gateway.application.dto.UpdateMerchantRequest;
import com.gateway.application.service.MerchantManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/platform/merchants")
@RequiredArgsConstructor
public class MerchantManagementController {
    private final MerchantManagementService service;

    @PostMapping
    public ResponseEntity<MerchantOnboardingResponse> onboard(@Valid @RequestBody CreateMerchantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.onboard(request));
    }

    @GetMapping
    public List<PlatformMerchantResponse> list() {
        return service.list();
    }

    @PutMapping("/{id}")
    public PlatformMerchantResponse update(@PathVariable UUID id,
                                           @Valid @RequestBody UpdateMerchantRequest request) {
        return service.update(id, request);
    }
}
