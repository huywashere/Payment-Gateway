package com.gateway.application.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class CreatePaymentLinkRequest {
    @NotNull @Min(1000) private Long amount;
    @NotBlank @Pattern(regexp = "[A-Za-z]{3}") private String currency = "VND";
    @NotBlank @Size(max = 255) private String description;
    private UUID bankAccountId;
    @Min(5) @Max(10080) private Integer expiresInMinutes = 30;
    @Pattern(regexp = "[A-Za-z]{2,5}") private String paymentCodePrefix = "PAY";
}
