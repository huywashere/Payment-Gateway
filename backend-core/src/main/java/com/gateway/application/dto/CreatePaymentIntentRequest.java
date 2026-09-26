package com.gateway.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentIntentRequest {

    @NotNull(message = "Amount is required")
    @Min(value = 1000, message = "Amount must be at least 1,000 VND")
    private Long amount;

    @NotBlank(message = "Currency is required")
    @Builder.Default
    private String currency = "VND";

    private String description;

    private String customerEmail;

    private String customerName;

    private Map<String, Object> metadata;
}
