package com.gateway.presentation.rest.v1;

import com.gateway.application.service.CustomerDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/customers")
@RequiredArgsConstructor
public class CustomerDataController {
    private final CustomerDataService customerDataService;

    @DeleteMapping("/{customerId}/pii")
    @PreAuthorize("hasAnyAuthority('SCOPE_customers:write', 'SCOPE_*')")
    public Map<String, Object> erase(Authentication authentication, @PathVariable UUID customerId) {
        return customerDataService.erase((UUID) authentication.getPrincipal(), customerId);
    }
}
