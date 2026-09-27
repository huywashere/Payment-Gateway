package com.gateway.application.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SubmitDisputeEvidenceRequest {
    @NotEmpty private Map<String, Object> evidence;
}
