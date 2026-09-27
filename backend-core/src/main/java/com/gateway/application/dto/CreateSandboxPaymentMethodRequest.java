package com.gateway.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSandboxPaymentMethodRequest {
    @NotBlank
    private String type;
    @Builder.Default
    private String scenario = "success";
    private String holderName;
}

