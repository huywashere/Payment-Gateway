package com.gateway.application.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateMerchantRequest {
    @Pattern(regexp = "ACTIVE|SUSPENDED|CLOSED")
    private String status;
    @Pattern(regexp = "PENDING|ACTIVE|BLOCKED")
    private String onboardingStatus;
    @Pattern(regexp = "NOT_STARTED|PENDING|VERIFIED|REJECTED")
    private String kybStatus;
    @Size(max = 255)
    private String legalName;
}
