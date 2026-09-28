package com.gateway.presentation.rest.v1;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.BankSandboxCallbackRequest;
import com.gateway.application.dto.BankSandboxReversalRequest;
import com.gateway.application.service.BankSandboxCallbackService;
import com.gateway.infrastructure.adapter.processor.BankProcessor;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/sandbox/bank")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "gateway.mode", havingValue = "sandbox", matchIfMissing = true)
public class BankSandboxController {
    private final BankProcessor processor;
    private final BankSandboxCallbackService callbackService;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    @GetMapping("/providers")
    public ResponseEntity<Map<String, Object>> providers() {
        return ResponseEntity.ok(Map.of("data", processor.availableBanks(), "mode", "simulated-sandbox"));
    }

    @PostMapping("/callbacks")
    public ResponseEntity<Map<String, Object>> callback(
            @RequestHeader("X-Bank-Signature") String signature,
            @RequestBody String payload) throws Exception {
        BankSandboxCallbackRequest request = objectMapper.readValue(payload, BankSandboxCallbackRequest.class);
        var violations = validator.validate(request);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
        return ResponseEntity.ok(callbackService.accept(request, payload, signature));
    }

    @PostMapping("/{bankCode}/callbacks")
    public ResponseEntity<Map<String, Object>> bankCallback(
            @PathVariable String bankCode,
            @RequestHeader("X-Bank-Signature") String signature,
            @RequestBody String payload) throws Exception {
        BankSandboxCallbackRequest request = objectMapper.readValue(payload, BankSandboxCallbackRequest.class);
        var violations = validator.validate(request);
        if (!violations.isEmpty()) throw new ConstraintViolationException(violations);
        return ResponseEntity.ok(callbackService.accept(bankCode, request, payload, signature));
    }

    @PostMapping("/reversals")
    public ResponseEntity<BankProcessor.BankReversalResponse> reverse(
            @Valid @RequestBody BankSandboxReversalRequest request) {
        return ResponseEntity.ok(processor.reversePayment(BankProcessor.BankReversalRequest.builder()
                .bankCode(request.getBankCode())
                .processorTransactionId(request.getProcessorTransactionId())
                .amount(request.getAmount()).currency(request.getCurrency()).reason(request.getReason()).build()));
    }
}
