package com.gateway.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SandboxCheckoutRequest {
    @NotBlank
    private String paymentMethodType;
    private String bankCode;
    @Builder.Default
    private String scenario = "success";
    private String returnUrl;
}
