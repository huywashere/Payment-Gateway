package com.gateway.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateBankAccountRequest {
    @NotBlank private String bankCode;
    @NotBlank @Pattern(regexp = "[A-Za-z0-9]{5,30}") private String accountNumber;
    @NotBlank private String accountName;
    private String accountType = "BUSINESS";
    private boolean defaultAccount;
}
