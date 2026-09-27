package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RiskProfileResponse {
    private UUID merchantId;
    private Boolean enabled;
    private Long maxTransactionAmount;
    private Long dailyVolumeLimit;
    private Integer velocityLimitPerMinute;
    private Integer reviewScoreThreshold;
    private Integer blockScoreThreshold;
    private Set<String> blockedEmailDomains;
    private OffsetDateTime updatedAt;
}
