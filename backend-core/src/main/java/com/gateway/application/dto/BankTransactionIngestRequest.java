package com.gateway.application.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class BankTransactionIngestRequest {
    @NotNull private UUID bankAccountId;
    @NotBlank private String externalReference;
    @NotBlank @Pattern(regexp = "IN|OUT") private String direction;
    @NotNull @Min(1) private Long amount;
    @NotBlank @Pattern(regexp = "[A-Za-z]{3}") private String currency = "VND";
    private String description;
    private String counterpartyAccount;
    @NotNull private OffsetDateTime occurredAt;
}
