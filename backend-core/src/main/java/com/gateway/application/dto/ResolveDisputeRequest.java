package com.gateway.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ResolveDisputeRequest {
    @NotBlank private String outcome;
}
