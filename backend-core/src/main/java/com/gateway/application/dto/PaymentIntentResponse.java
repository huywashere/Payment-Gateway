package com.gateway.application.dto;

import com.gateway.domain.model.payment.PaymentIntentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentIntentResponse {
    private UUID id;
    private String object; // "payment_intent"
    private Long amount;
    private String currency;
    private PaymentIntentStatus status;
    private String clientSecret;
    private String description;
    private String paymentMethodToken;
    private String nextActionUrl;
    private String failureMessage;
    private Map<String, Object> metadata;
    private OffsetDateTime createdAt;
}
