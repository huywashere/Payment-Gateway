package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReconciliationRunResponse {
    private UUID id;
    private String object;
    private UUID merchantId;
    private String processorCode;
    private String status;
    private Integer matchedCount;
    private Integer mismatchCount;
    private Integer externalCount;
    private Integer internalCount;
    private OffsetDateTime periodStart;
    private OffsetDateTime periodEnd;
    private OffsetDateTime createdAt;
    private OffsetDateTime completedAt;
    private List<ReconciliationItemResponse> items;
}
