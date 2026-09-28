package com.gateway.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BankSandboxReversalRequest {
    private String bankCode;
    @NotBlank private String processorTransactionId;
    @NotNull @Min(1) private Long amount;
    @NotBlank private String currency;
    private String reason;
}
