package com.gateway.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder
public class PaymentLinkResponse {
    private UUID id;
    private String object;
    private String slug;
    private String paymentCode;
    private Long amount;
    private String currency;
    private String description;
    private String status;
    private String bankCode;
    private String bankName;
    private String accountNumber;
    private String accountName;
    private String qrPayload;
    private String paymentUrl;
    private String qrImageUrl;
    private OffsetDateTime expiresAt;
    private OffsetDateTime paidAt;
}
