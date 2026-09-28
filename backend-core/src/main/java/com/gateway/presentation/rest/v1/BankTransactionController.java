package com.gateway.presentation.rest.v1;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.BankTransactionIngestRequest;
import com.gateway.application.dto.BankTransactionResponse;
import com.gateway.application.service.BankTransactionService;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/bank_transactions")
@RequiredArgsConstructor
public class BankTransactionController {
    private final BankTransactionService service;
    private final ObjectMapper objectMapper;
    private final Validator validator;

    @GetMapping
    public List<BankTransactionResponse> list(Authentication authentication,
                                              @RequestParam(defaultValue = "50") int limit) {
        return service.list((UUID) authentication.getPrincipal(), limit);
    }

    @GetMapping("/{id}")
    public BankTransactionResponse get(Authentication authentication, @PathVariable UUID id) {
        return service.get((UUID) authentication.getPrincipal(), id);
    }

    @PostMapping("/inbox/{bankCode}")
    public BankTransactionResponse ingest(@PathVariable String bankCode,
                                          @RequestHeader("X-Bank-Signature") String signature,
                                          @RequestBody String payload) throws Exception {
        BankTransactionIngestRequest request = objectMapper.readValue(payload, BankTransactionIngestRequest.class);
        var violations = validator.validate(request);
        if (!violations.isEmpty()) throw new ConstraintViolationException(violations);
        return service.ingest(bankCode, request, payload, signature);
    }
}
