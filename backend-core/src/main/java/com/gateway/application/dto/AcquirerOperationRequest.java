package com.gateway.application.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class AcquirerOperationRequest {
    private UUID paymentIntentId;
    private UUID parentOperationId;
    @NotBlank @Pattern(regexp = "AUTHORIZE|CAPTURE|VOID|REFUND|DISPUTE") private String operationType;
    @NotNull @Min(1) private Long amount;
    @NotBlank @Pattern(regexp = "[A-Za-z]{3}") private String currency = "VND";
    private String scenario = "success";
    private boolean requestThreeDs;
}
