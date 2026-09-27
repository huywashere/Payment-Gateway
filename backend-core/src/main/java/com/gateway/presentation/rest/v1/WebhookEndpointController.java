package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.CreateWebhookEndpointRequest;
import com.gateway.application.dto.WebhookEndpointResponse;
import com.gateway.application.service.WebhookEndpointService;
import com.gateway.infrastructure.adapter.persistence.entity.WebhookDeliveryEntity;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookDeliveryRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/webhooks")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('SCOPE_webhooks:write', 'SCOPE_*')")
public class WebhookEndpointController {
    private final WebhookEndpointService service;
    private final WebhookDeliveryRepository deliveryRepository;

    @GetMapping("/endpoints")
    public List<WebhookEndpointResponse> endpoints(Authentication authentication) {
        return service.list((UUID) authentication.getPrincipal());
    }

    @PostMapping("/endpoints")
    public ResponseEntity<WebhookEndpointResponse> create(Authentication authentication,
                                                          @Valid @RequestBody CreateWebhookEndpointRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(
                (UUID) authentication.getPrincipal(), request));
    }

    @DeleteMapping("/endpoints/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disable(Authentication authentication, @PathVariable UUID id) {
        service.disable((UUID) authentication.getPrincipal(), id);
    }

    @GetMapping("/deliveries")
    public List<WebhookDeliveryEntity> deliveries(Authentication authentication,
                                                   @RequestParam(defaultValue = "25") int limit) {
        int bounded = Math.max(1, Math.min(limit, 100));
        return deliveryRepository.findByMerchantIdOrderByCreatedAtDesc(
                (UUID) authentication.getPrincipal(), PageRequest.of(0, bounded)).getContent();
    }

    @PostMapping("/deliveries/{id}/replay")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void replay(Authentication authentication, @PathVariable UUID id) {
        service.replay((UUID) authentication.getPrincipal(), id);
    }
}

