package com.gateway.application.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CreatePayoutRequest {
    @NotNull @Min(1000) private Long amount;
    @Builder.Default private String currency = "VND";
    @NotBlank private String destinationReference;
    private String description;
}
