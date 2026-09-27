package com.gateway.application.dto;

import lombok.*;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodResponse {
    private String id;
    private String object;
    private String type;
    private String scenario;
    private Boolean sandbox;
    private OffsetDateTime createdAt;
}

