package com.gateway.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder
public class BankTransactionResponse {
    private UUID id;
    private String object;
    private UUID bankAccountId;
    private String bankCode;
    private String externalReference;
    private String direction;
    private Long amount;
    private String currency;
    private String description;
    private String paymentCode;
    private String matchStatus;
    private UUID paymentIntentId;
    private OffsetDateTime occurredAt;
    private OffsetDateTime receivedAt;
}
