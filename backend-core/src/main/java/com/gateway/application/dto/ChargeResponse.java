package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChargeResponse {
    private UUID id;
    private String object;
    private UUID paymentIntentId;
    private Long amount;
    private Long feeAmount;
    private String currency;
    private String status;
    private String processorCode;
    private String processorTransactionId;
    private OffsetDateTime createdAt;
}
