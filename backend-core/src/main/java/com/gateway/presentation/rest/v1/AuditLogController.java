package com.gateway.presentation.rest.v1;

import com.gateway.infrastructure.adapter.persistence.entity.AuditLogEntity;
import com.gateway.infrastructure.adapter.persistence.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import java.nio.charset.StandardCharsets;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/audit_logs")
@RequiredArgsConstructor
public class AuditLogController {
    private final AuditLogRepository repository;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('SCOPE_audit:read', 'SCOPE_*')")
    public List<AuditLogEntity> list(Authentication authentication,
                                     @RequestParam(defaultValue = "50") int limit,
                                     @RequestParam(required = false) String action,
                                     @RequestParam(name = "resource_type", required = false) String resourceType,
                                     @RequestParam(required = false) String query) {
        return filtered((UUID) authentication.getPrincipal(), Math.max(1, Math.min(limit, 250)), action, resourceType, query);
    }

    @GetMapping(value = "/export.csv", produces = "text/csv; charset=UTF-8")
    @PreAuthorize("hasAnyAuthority('SCOPE_audit:read', 'SCOPE_*')")
    public ResponseEntity<byte[]> export(Authentication authentication) {
        StringBuilder csv = new StringBuilder("created_at,actor_type,actor_id,action,resource_type,resource_id,request_id,ip_address\r\n");
        filtered((UUID) authentication.getPrincipal(), 1000, null, null, null).forEach(log -> csv
                .append(cell(log.getCreatedAt())).append(',').append(cell(log.getActorType())).append(',')
                .append(cell(log.getActorId())).append(',').append(cell(log.getAction())).append(',')
                .append(cell(log.getResourceType())).append(',').append(cell(log.getResourceId())).append(',')
                .append(cell(log.getRequestId())).append(',').append(cell(log.getIpAddress())).append("\r\n"));
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit-logs.csv")
                .body(("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8));
    }

    private List<AuditLogEntity> filtered(UUID merchantId, int limit, String action, String resourceType, String query) {
        String normalizedQuery = query == null ? "" : query.toLowerCase();
        return repository.findByMerchantIdOrderByCreatedAtDesc(merchantId, PageRequest.of(0, Math.min(limit, 1000)))
                .stream().filter(log -> action == null || action.isBlank() || log.getAction().equalsIgnoreCase(action))
                .filter(log -> resourceType == null || resourceType.isBlank() || log.getResourceType().equalsIgnoreCase(resourceType))
                .filter(log -> normalizedQuery.isBlank() || String.join(" ", safe(log.getActorId()), safe(log.getAction()),
                        safe(log.getResourceType()), safe(log.getResourceId()), safe(log.getRequestId()))
                        .toLowerCase().contains(normalizedQuery))
                .toList();
    }

    private static String safe(Object value) { return value == null ? "" : value.toString(); }
    private static String cell(Object value) { return "\"" + safe(value).replace("\"", "\"\"") + "\""; }
}
