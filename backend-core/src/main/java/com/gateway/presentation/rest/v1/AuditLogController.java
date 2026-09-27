package com.gateway.presentation.rest.v1;

import com.gateway.infrastructure.adapter.persistence.entity.AuditLogEntity;
import com.gateway.infrastructure.adapter.persistence.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
                                     @RequestParam(defaultValue = "50") int limit) {
        return repository.findByMerchantIdOrderByCreatedAtDesc((UUID) authentication.getPrincipal(),
                PageRequest.of(0, Math.max(1, Math.min(limit, 100)))).getContent();
    }
}
