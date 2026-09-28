package com.gateway.presentation.rest.v1;

import com.gateway.application.service.SandboxMaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/sandbox")
@RequiredArgsConstructor
public class SandboxMaintenanceController {
    private final SandboxMaintenanceService service;

    @PostMapping("/reset")
    public Map<String, Object> reset(Authentication authentication) {
        return service.softReset((UUID) authentication.getPrincipal());
    }
}
