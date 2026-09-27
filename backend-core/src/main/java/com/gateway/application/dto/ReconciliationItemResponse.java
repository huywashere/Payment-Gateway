package com.gateway.application.dto;

import lombok.*;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReconciliationItemResponse {
    private UUID id;
    private UUID chargeId;
    private String processorTxId;
    private String result;
    private Long internalAmount;
    private Long externalAmount;
    private String internalStatus;
    private String externalStatus;
    private String details;
}
