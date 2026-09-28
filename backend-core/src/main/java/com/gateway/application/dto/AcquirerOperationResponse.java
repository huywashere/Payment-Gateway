package com.gateway.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder
public class AcquirerOperationResponse {
    private UUID id;
    private String object;
    private UUID paymentIntentId;
    private UUID parentOperationId;
    private String operationType;
    private String processorCode;
    private String processorReference;
    private Long amount;
    private String currency;
    private String status;
    private String threeDsVersion;
    private String actionUrl;
    private String failureCode;
    private OffsetDateTime createdAt;
}
