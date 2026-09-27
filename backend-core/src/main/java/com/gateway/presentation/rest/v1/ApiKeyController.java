package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.ApiKeyResponse;
import com.gateway.application.dto.CreateApiKeyRequest;
import com.gateway.application.service.ApiKeyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/api_keys")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('SCOPE_keys:write', 'SCOPE_*')")
public class ApiKeyController {
    private final ApiKeyService service;

    @GetMapping
    public List<ApiKeyResponse> list(Authentication authentication) {
        return service.list((UUID) authentication.getPrincipal());
    }

    @PostMapping
    public ResponseEntity<ApiKeyResponse> create(Authentication authentication,
                                                 @Valid @RequestBody CreateApiKeyRequest request) {
        UUID merchantId = (UUID) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(merchantId, request, merchantId.toString()));
    }

    @PostMapping("/{id}/rotate")
    public ApiKeyResponse rotate(Authentication authentication, @PathVariable UUID id) {
        UUID merchantId = (UUID) authentication.getPrincipal();
        return service.rotate(merchantId, id, merchantId.toString());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(Authentication authentication, @PathVariable UUID id) {
        UUID merchantId = (UUID) authentication.getPrincipal();
        service.revoke(merchantId, id, merchantId.toString());
    }
}

