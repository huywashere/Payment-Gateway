package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyResponse {
    private UUID id;
    private String object;
    private String displayName;
    private String keyPrefix;
    private String keyType;
    private String environment;
    private Set<String> scopes;
    private Boolean active;
    private String secret;
    private OffsetDateTime createdAt;
    private OffsetDateTime lastUsedAt;
}

