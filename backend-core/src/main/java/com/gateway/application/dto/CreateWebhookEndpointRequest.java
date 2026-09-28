package com.gateway.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import java.util.Set;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWebhookEndpointRequest {
    @NotBlank
    @Pattern(regexp = "https?://.+", message = "Webhook URL must use http or https")
    private String url;
    private String description;
    private Set<String> subscribedEvents;
    @Pattern(regexp = "HMAC_SHA256|API_KEY|OAUTH2")
    private String authType;
    private Map<String, String> authConfig;
    private Set<String> bankCodes;
    private Set<String> accountIds;
    private Set<String> directions;
    private Set<String> paymentCodePrefixes;
    @Pattern(regexp = "EMAIL|SLACK|TELEGRAM", message = "Alert channel must be EMAIL, SLACK, or TELEGRAM")
    private String alertChannel;
    private String alertDestination;
}
