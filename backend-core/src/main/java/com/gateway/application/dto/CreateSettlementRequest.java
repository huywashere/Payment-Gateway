package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateSettlementRequest {
    private OffsetDateTime cutoff;
    @Builder.Default private String currency = "VND";
}
