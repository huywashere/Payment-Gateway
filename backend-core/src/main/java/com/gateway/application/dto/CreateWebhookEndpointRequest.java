package com.gateway.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import java.util.Set;

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
}

