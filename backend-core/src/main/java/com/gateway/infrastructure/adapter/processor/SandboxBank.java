package com.gateway.infrastructure.adapter.processor;

import java.util.Arrays;
import java.util.Locale;

public enum SandboxBank {
    ACB("Asia Commercial Bank"),
    BIDV("Bank for Investment and Development of Vietnam"),
    VIETINBANK("Vietnam Joint Stock Commercial Bank for Industry and Trade"),
    NCB("National Citizen Commercial Bank");

    private final String displayName;

    SandboxBank(String displayName) {
        this.displayName = displayName;
    }

    public String displayName() {
        return displayName;
    }

    public String idPrefix() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static SandboxBank fromCode(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("A sandbox bank code is required");
        }
        String normalized = value.trim().replace("-", "").replace("_", "").toUpperCase(Locale.ROOT);
        if ("CTG".equals(normalized)) normalized = "VIETINBANK";
        final String code = normalized;
        return Arrays.stream(values())
                .filter(bank -> bank.name().equals(code))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported sandbox bank: " + value));
    }

    public static SandboxBank fromTransactionId(String transactionId) {
        if (transactionId == null) return null;
        return Arrays.stream(values())
                .filter(bank -> transactionId.startsWith(bank.idPrefix() + "_txn_"))
                .findFirst().orElse(null);
    }
}
