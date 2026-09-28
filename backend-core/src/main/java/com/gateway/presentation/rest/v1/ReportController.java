package com.gateway.presentation.rest.v1;

import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import com.gateway.infrastructure.adapter.persistence.repository.ChargeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/v1/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ChargeRepository repository;

    @GetMapping(value = "/transactions.csv", produces = "text/csv")
    public ResponseEntity<byte[]> transactions(Authentication authentication,
                                               @RequestParam(defaultValue = "1000") int limit) {
        int bounded = Math.max(1, Math.min(limit, 10_000));
        StringBuilder csv = new StringBuilder("charge_id,payment_intent_id,amount,fee,currency,status,processor,processor_reference,created_at\n");
        for (ChargeEntity charge : repository.findByMerchantIdOrderByCreatedAtDesc(
                (UUID) authentication.getPrincipal(), PageRequest.of(0, bounded))) {
            csv.append(charge.getId()).append(',').append(charge.getPaymentIntentId()).append(',')
                    .append(charge.getAmount()).append(',').append(charge.getFeeAmount()).append(',')
                    .append(charge.getCurrency()).append(',').append(charge.getStatus()).append(',')
                    .append(escape(charge.getProcessorCode())).append(',').append(escape(charge.getProcessorTxId())).append(',')
                    .append(charge.getCreatedAt()).append('\n');
        }
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=transactions.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private String escape(String value) {
        if (value == null) return "";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
