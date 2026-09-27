package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PayoutResponse {
    private UUID id;
    private String object;
    private Long amount;
    private String currency;
    private String status;
    private String destinationReference;
    private String description;
    private String processorPayoutId;
    private OffsetDateTime createdAt;
    private OffsetDateTime paidAt;
}
