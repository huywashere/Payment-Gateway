package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SettlementResponse {
    private UUID id;
    private String object;
    private String status;
    private String currency;
    private Long grossAmount;
    private Long feeAmount;
    private Long refundAmount;
    private Long netAmount;
    private Integer chargeCount;
    private OffsetDateTime periodStart;
    private OffsetDateTime periodEnd;
    private OffsetDateTime createdAt;
    private OffsetDateTime finalizedAt;
}
