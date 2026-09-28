package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookEndpointResponse {
    private UUID id;
    private String object;
    private String url;
    private String description;
    private Set<String> subscribedEvents;
    private String status;
    private String signingSecret;
    private String authType;
    private Set<String> bankCodes;
    private Set<String> accountIds;
    private Set<String> directions;
    private Set<String> paymentCodePrefixes;
    private Integer consecutiveFailures;
    private String alertChannel;
    private String alertDestination;
    private OffsetDateTime previousSecretValidUntil;
    private OffsetDateTime createdAt;
}
