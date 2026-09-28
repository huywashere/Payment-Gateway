package com.gateway.application.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder
public class BankAccountResponse {
    private UUID id;
    private String object;
    private String bankCode;
    private String bankBin;
    private String accountNumberMasked;
    private String accountName;
    private String accountType;
    private String connectionMode;
    private String status;
    private boolean defaultAccount;
    private OffsetDateTime lastSyncedAt;
    private OffsetDateTime createdAt;
}
