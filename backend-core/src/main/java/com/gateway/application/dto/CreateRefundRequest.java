package com.gateway.application.dto;

import jakarta.validation.constraints.Min;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRefundRequest {
    @Min(value = 1, message = "Refund amount must be positive")
    private Long amount;
    private String reason;
}

