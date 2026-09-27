package com.gateway.application.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReconciliationRecordRequest {
    @NotBlank private String processorTxId;
    @NotNull @Min(0) private Long amount;
    @NotBlank private String status;
}
