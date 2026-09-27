package com.gateway.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMerchantRequest {
    @NotBlank
    private String businessName;
    @NotBlank
    @Email
    private String email;
}

