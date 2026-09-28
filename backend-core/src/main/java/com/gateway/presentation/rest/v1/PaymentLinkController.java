package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.CreatePaymentLinkRequest;
import com.gateway.application.dto.PaymentLinkResponse;
import com.gateway.application.service.PaymentLinkService;
import com.gateway.application.service.PaymentLinkRealtimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/v1/payment_links")
@RequiredArgsConstructor
public class PaymentLinkController {
    private final PaymentLinkService service;
    private final PaymentLinkRealtimeService realtimeService;

    @GetMapping
    public List<PaymentLinkResponse> list(Authentication authentication) {
        return service.list((UUID) authentication.getPrincipal());
    }

    @GetMapping("/{id}")
    public PaymentLinkResponse get(Authentication authentication, @PathVariable UUID id) {
        return service.get((UUID) authentication.getPrincipal(), id);
    }

    @PostMapping
    public ResponseEntity<PaymentLinkResponse> create(Authentication authentication,
                                                      @RequestHeader("Idempotency-Key") String idempotencyKey,
                                                      @Valid @RequestBody CreatePaymentLinkRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create((UUID) authentication.getPrincipal(), idempotencyKey, request));
    }

    @GetMapping("/public/{slug}")
    public PaymentLinkResponse publicStatus(@PathVariable String slug) {
        return service.publicStatus(slug);
    }

    @GetMapping(value = "/public/{slug}/qr.svg", produces = "image/svg+xml")
    public ResponseEntity<String> qr(@PathVariable String slug, @RequestParam(defaultValue = "360") int size) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(service.qrSvg(slug, size));
    }

    @GetMapping(value = "/public/{slug}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events(@PathVariable String slug) {
        return realtimeService.subscribe(service.publicStatus(slug));
    }
}
