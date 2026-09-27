package com.gateway.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateReconciliationRunRequest {
    @NotNull private UUID merchantId;
    @NotBlank private String processorCode;
    @NotNull private OffsetDateTime periodStart;
    @NotNull private OffsetDateTime periodEnd;
    @NotEmpty private List<@Valid ReconciliationRecordRequest> records;
}
