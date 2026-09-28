package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.BankAccountResponse;
import com.gateway.application.dto.CreateBankAccountRequest;
import com.gateway.application.service.BankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/bank_accounts")
@RequiredArgsConstructor
public class BankAccountController {
    private final BankAccountService service;

    @GetMapping
    public List<BankAccountResponse> list(Authentication authentication) {
        return service.list((UUID) authentication.getPrincipal());
    }

    @PostMapping
    public ResponseEntity<BankAccountResponse> create(Authentication authentication,
                                                      @Valid @RequestBody CreateBankAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create((UUID) authentication.getPrincipal(), request));
    }

    @PostMapping("/{id}/default")
    public BankAccountResponse makeDefault(Authentication authentication, @PathVariable UUID id) {
        return service.makeDefault((UUID) authentication.getPrincipal(), id);
    }

    @PostMapping("/{id}/sync")
    public BankAccountResponse sync(Authentication authentication, @PathVariable UUID id) {
        return service.sync((UUID) authentication.getPrincipal(), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disable(Authentication authentication, @PathVariable UUID id) {
        service.disable((UUID) authentication.getPrincipal(), id);
    }
}
