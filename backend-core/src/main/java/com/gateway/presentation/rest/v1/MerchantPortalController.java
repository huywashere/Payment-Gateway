package com.gateway.presentation.rest.v1;

import com.gateway.application.service.*;
import com.gateway.infrastructure.adapter.persistence.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class MerchantPortalController {
    private final DashboardAnalyticsService analyticsService;
    private final DashboardRealtimeService realtimeService;
    private final PortalNotificationService notificationService;
    private final BillingService billingService;

    @GetMapping("/dashboard/overview")
    public Map<String, Object> overview(Authentication authentication, @RequestParam(defaultValue = "30") int days) {
        return analyticsService.overview((UUID) authentication.getPrincipal(), days);
    }

    @GetMapping(value = "/dashboard/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter events(Authentication authentication) {
        return realtimeService.subscribe((UUID) authentication.getPrincipal());
    }

    @GetMapping("/notifications")
    public Map<String, Object> notifications(Authentication authentication,
                                              @RequestParam(defaultValue = "20") int limit) {
        UUID merchantId = (UUID) authentication.getPrincipal();
        return Map.of("items", notificationService.list(merchantId, limit),
                "unread_count", notificationService.unreadCount(merchantId));
    }

    @PostMapping("/notifications/{id}/read")
    public PortalNotificationEntity markRead(Authentication authentication, @PathVariable UUID id) {
        return notificationService.markRead((UUID) authentication.getPrincipal(), id);
    }

    @PostMapping("/notifications/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(Authentication authentication) {
        notificationService.markAllRead((UUID) authentication.getPrincipal());
    }

    @GetMapping("/billing/invoices")
    public List<BillingInvoiceEntity> invoices(Authentication authentication) {
        return billingService.invoices((UUID) authentication.getPrincipal());
    }

    @GetMapping("/billing/subscription-events")
    public List<SubscriptionEventEntity> subscriptionEvents(Authentication authentication) {
        return billingService.events((UUID) authentication.getPrincipal());
    }

    @GetMapping(value = "/billing/invoices/{id}.csv", produces = "text/csv; charset=UTF-8")
    public ResponseEntity<byte[]> invoiceCsv(Authentication authentication, @PathVariable UUID id) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + id + ".csv")
                .body(billingService.invoiceCsv((UUID) authentication.getPrincipal(), id));
    }
}
