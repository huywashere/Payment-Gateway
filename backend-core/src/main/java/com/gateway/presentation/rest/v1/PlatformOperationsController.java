package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.*;
import com.gateway.application.service.DisputeService;
import com.gateway.application.service.ReconciliationService;
import com.gateway.application.service.OperationsReadinessService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/v1/platform")
@RequiredArgsConstructor
public class PlatformOperationsController {
    private final DisputeService disputeService;
    private final ReconciliationService reconciliationService;
    private final OperationsReadinessService operationsReadinessService;

    @PostMapping("/disputes")
    public ResponseEntity<DisputeResponse> createDispute(@Valid @RequestBody CreateDisputeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(disputeService.create(request));
    }

    @PostMapping("/disputes/{id}/resolve")
    public DisputeResponse resolveDispute(@PathVariable UUID id,
                                          @Valid @RequestBody ResolveDisputeRequest request) {
        return disputeService.resolve(id, request);
    }

    @PostMapping("/reconciliation_runs")
    public ResponseEntity<ReconciliationRunResponse> reconcile(
            @Valid @RequestBody CreateReconciliationRunRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reconciliationService.run(request));
    }

    @GetMapping("/operations/readiness")
    public Map<String, Object> operationsReadiness() {
        return operationsReadinessService.snapshot();
    }
}
