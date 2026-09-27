package com.gateway.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateApiKeyRequest {
    @NotBlank
    private String displayName;
    @Builder.Default
    private String keyType = "SECRET";
    @Builder.Default
    private String environment = "TEST";
    private Set<String> scopes;
}

