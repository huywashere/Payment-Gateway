package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MerchantOnboardingResponse {
    private UUID id;
    private String object;
    private String businessName;
    private String email;
    private String status;
    private String testSecretKey;
    private String testPublishableKey;
    private String webhookSigningSecret;
    private OffsetDateTime createdAt;
}

