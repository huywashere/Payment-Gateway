package com.gateway.application.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PayOsWebhookPayload {
    private String code;
    private String desc;
    private PayOsData data;
    private String signature;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PayOsData {
        private Long orderCode;
        private Long amount;
        private String description;
        private String accountNumber;
        private String reference;
        private String transactionDateTime;
        private String currency;
        private String paymentLinkId;
    }
}
