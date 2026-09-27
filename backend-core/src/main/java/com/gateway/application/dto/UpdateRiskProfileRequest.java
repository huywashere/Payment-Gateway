package com.gateway.application.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.Set;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UpdateRiskProfileRequest {
    private Boolean enabled;
    @Min(1000) private Long maxTransactionAmount;
    @Min(1000) private Long dailyVolumeLimit;
    @Min(1) @Max(10000) private Integer velocityLimitPerMinute;
    @Min(1) @Max(100) private Integer reviewScoreThreshold;
    @Min(1) @Max(100) private Integer blockScoreThreshold;
    private Set<String> blockedEmailDomains;
}
