package com.gateway.application.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreateDisputeRequest {
    @NotNull private UUID merchantId;
    @NotNull private UUID chargeId;
    @NotNull @Min(1) private Long amount;
    @NotBlank private String reason;
    private OffsetDateTime dueAt;
}
