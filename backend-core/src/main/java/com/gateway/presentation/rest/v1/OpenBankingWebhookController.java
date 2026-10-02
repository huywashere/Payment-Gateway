package com.gateway.presentation.rest.v1;

import com.gateway.application.dto.BankTransactionResponse;
import com.gateway.application.service.OpenBankingWebhookService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/open_banking/webhook")
@RequiredArgsConstructor
@Tag(name = "Open Banking Webhook", description = "Real-time bank transfer webhooks (SePay, PayOS, Casso)")
public class OpenBankingWebhookController {
    private final OpenBankingWebhookService openBankingWebhookService;

    @PostMapping("/sepay")
    @Operation(summary = "Nhận biến động số dư ngân hàng thật từ SePay")
    public ResponseEntity<Map<String, Object>> handleSepay(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Api-Key", required = false) String apiKeyHeader,
            @RequestBody String rawPayload) {
        BankTransactionResponse response = openBankingWebhookService.processSepay(authHeader, apiKeyHeader, rawPayload);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "status", response.getMatchStatus(),
                "paymentCode", response.getPaymentCode() != null ? response.getPaymentCode() : "",
                "transactionId", response.getId()
        ));
    }

    @PostMapping("/payos")
    @Operation(summary = "Nhận biến động số dư ngân hàng thật từ PayOS")
    public ResponseEntity<Map<String, Object>> handlePayOs(@RequestBody String rawPayload) {
        BankTransactionResponse response = openBankingWebhookService.processPayOs(rawPayload);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "status", response.getMatchStatus(),
                "paymentCode", response.getPaymentCode() != null ? response.getPaymentCode() : "",
                "transactionId", response.getId()
        ));
    }
}
