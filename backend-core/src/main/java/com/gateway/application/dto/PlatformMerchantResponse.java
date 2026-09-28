package com.gateway.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class PlatformMerchantResponse {
    private UUID id;
    private String object;
    private String businessName;
    private String legalName;
    private String email;
    private String status;
    private String onboardingStatus;
    private String kybStatus;
    private String plan;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
