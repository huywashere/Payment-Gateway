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
    private OffsetDateTime createdAt;
}

