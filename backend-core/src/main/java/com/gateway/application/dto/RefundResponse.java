package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefundResponse {
    private UUID id;
    private String object;
    private UUID chargeId;
    private Long amount;
    private String currency;
    private String status;
    private String reason;
    private OffsetDateTime createdAt;
}

