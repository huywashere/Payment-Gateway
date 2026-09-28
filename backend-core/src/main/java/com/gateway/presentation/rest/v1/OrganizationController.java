package com.gateway.presentation.rest.v1;

import com.gateway.application.service.OrganizationService;
import com.gateway.application.service.SubscriptionService;
import com.gateway.infrastructure.adapter.persistence.entity.OrganizationMemberEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PlanEntity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/v1/organization")
@RequiredArgsConstructor
public class OrganizationController {
    private final OrganizationService organizationService;
    private final SubscriptionService subscriptionService;

    @GetMapping("/members")
    public List<OrganizationMemberEntity> members(Authentication authentication) {
        return organizationService.list((UUID) authentication.getPrincipal());
    }

    @PostMapping("/members")
    public OrganizationMemberEntity invite(Authentication authentication, @Valid @RequestBody InviteMemberRequest request) {
        return organizationService.invite((UUID) authentication.getPrincipal(), request.email, request.displayName, request.role);
    }

    @PutMapping("/members/{id}")
    public OrganizationMemberEntity update(Authentication authentication, @PathVariable UUID id,
                                           @RequestBody UpdateMemberRequest request) {
        return organizationService.update((UUID) authentication.getPrincipal(), id, request.role, request.status);
    }

    @GetMapping("/subscription")
    public Map<String, Object> subscription(Authentication authentication) {
        return subscriptionService.summary((UUID) authentication.getPrincipal());
    }

    @PutMapping("/subscription")
    public Map<String, Object> changePlan(Authentication authentication, @RequestBody Map<String, String> request) {
        return subscriptionService.changePlan((UUID) authentication.getPrincipal(), request.getOrDefault("plan", "FREE"));
    }

    @GetMapping("/plans")
    public List<PlanEntity> plans() { return subscriptionService.plans(); }

    @Data public static class InviteMemberRequest {
        @NotBlank @Email private String email;
        private String displayName;
        @NotBlank private String role;
    }
    @Data public static class UpdateMemberRequest { private String role; private String status; }
}
