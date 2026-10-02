package com.gateway.application.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SepayWebhookPayload {
    private Long id;
    private String gateway;
    private String transactionDate;
    private String accountNumber;
    private String subAccount;
    private Long amountIn;
    private Long amountOut;
    private Long accumulated;
    private String code;
    private String transactionContent;
    private String referenceNumber;
    private String body;
}
