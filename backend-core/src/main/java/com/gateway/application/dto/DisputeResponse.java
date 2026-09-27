package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DisputeResponse {
    private UUID id;
    private String object;
    private UUID chargeId;
    private Long amount;
    private String currency;
    private String reason;
    private String status;
    private Map<String, Object> evidence;
    private OffsetDateTime dueAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime resolvedAt;
}
