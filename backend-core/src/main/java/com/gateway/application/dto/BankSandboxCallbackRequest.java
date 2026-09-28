package com.gateway.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BankSandboxCallbackRequest {
    private String bankCode;
    @NotBlank private String eventId;
    @NotBlank private String processorTransactionId;
    @NotBlank private String status;
    @NotNull @Min(1) private Long amount;
    @NotBlank private String currency;
}
