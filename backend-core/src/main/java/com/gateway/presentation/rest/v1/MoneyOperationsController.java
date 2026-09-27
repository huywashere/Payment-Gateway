package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.*;
import com.gateway.application.service.*;
import com.gateway.infrastructure.adapter.persistence.entity.RiskEvaluationEntity;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
public class MoneyOperationsController {
    private final SettlementService settlementService;
    private final PayoutService payoutService;
    private final DisputeService disputeService;
    private final ReconciliationService reconciliationService;
    private final RiskService riskService;

    @PostMapping("/settlements")
    @PreAuthorize("hasAnyAuthority('SCOPE_settlements:write', 'SCOPE_*')")
    public ResponseEntity<SettlementResponse> createSettlement(Authentication authentication,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreateSettlementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(settlementService.create(
                (UUID) authentication.getPrincipal(), idempotencyKey, request));
    }

    @GetMapping("/settlements")
    @PreAuthorize("hasAnyAuthority('SCOPE_settlements:read', 'SCOPE_*')")
    public List<SettlementResponse> settlements(Authentication authentication,
                                                 @RequestParam(defaultValue = "25") int limit) {
        return settlementService.list((UUID) authentication.getPrincipal(), limit);
    }

    @PostMapping("/payouts")
    @PreAuthorize("hasAnyAuthority('SCOPE_payouts:write', 'SCOPE_*')")
    public ResponseEntity<PayoutResponse> createPayout(Authentication authentication,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody CreatePayoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(payoutService.create(
                (UUID) authentication.getPrincipal(), idempotencyKey, request));
    }

    @GetMapping("/payouts")
    @PreAuthorize("hasAnyAuthority('SCOPE_payouts:read', 'SCOPE_*')")
    public List<PayoutResponse> payouts(Authentication authentication,
                                        @RequestParam(defaultValue = "25") int limit) {
        return payoutService.list((UUID) authentication.getPrincipal(), limit);
    }

    @GetMapping("/disputes")
    @PreAuthorize("hasAnyAuthority('SCOPE_disputes:read', 'SCOPE_*')")
    public List<DisputeResponse> disputes(Authentication authentication,
                                          @RequestParam(defaultValue = "25") int limit) {
        return disputeService.list((UUID) authentication.getPrincipal(), limit);
    }

    @PostMapping("/disputes/{id}/evidence")
    @PreAuthorize("hasAnyAuthority('SCOPE_disputes:write', 'SCOPE_*')")
    public DisputeResponse submitEvidence(Authentication authentication, @PathVariable UUID id,
                                          @Valid @RequestBody SubmitDisputeEvidenceRequest request) {
        return disputeService.submitEvidence((UUID) authentication.getPrincipal(), id, request);
    }

    @GetMapping("/risk/profile")
    @PreAuthorize("hasAnyAuthority('SCOPE_risk:read', 'SCOPE_*')")
    public RiskProfileResponse riskProfile(Authentication authentication) {
        return riskService.getProfile((UUID) authentication.getPrincipal());
    }

    @PutMapping("/risk/profile")
    @PreAuthorize("hasAnyAuthority('SCOPE_risk:write', 'SCOPE_*')")
    public RiskProfileResponse updateRiskProfile(Authentication authentication,
                                                  @Valid @RequestBody UpdateRiskProfileRequest request) {
        return riskService.updateProfile((UUID) authentication.getPrincipal(), request);
    }

    @GetMapping("/risk/evaluations")
    @PreAuthorize("hasAnyAuthority('SCOPE_risk:read', 'SCOPE_*')")
    public List<RiskEvaluationEntity> riskEvaluations(Authentication authentication,
                                                       @RequestParam(defaultValue = "25") int limit) {
        return riskService.evaluations((UUID) authentication.getPrincipal(), limit);
    }

    @GetMapping("/reconciliation_runs")
    @PreAuthorize("hasAnyAuthority('SCOPE_reconciliation:read', 'SCOPE_*')")
    public List<ReconciliationRunResponse> reconciliationRuns(Authentication authentication,
                                                              @RequestParam(defaultValue = "25") int limit) {
        return reconciliationService.list((UUID) authentication.getPrincipal(), limit);
    }

    @GetMapping("/reconciliation_runs/{id}")
    @PreAuthorize("hasAnyAuthority('SCOPE_reconciliation:read', 'SCOPE_*')")
    public ReconciliationRunResponse reconciliationRun(Authentication authentication, @PathVariable UUID id) {
        return reconciliationService.get((UUID) authentication.getPrincipal(), id);
    }
}
