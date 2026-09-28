package com.gateway.infrastructure.adapter.processor;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "gateway.processor")
public class BankSandboxProperties {
    private String defaultBank = "ACB";
    private String sandboxClientId = "project-client";
    private String sandboxClientSecret = "project-secret";
    private String sandboxCallbackSecret = "project-callback-secret";
    private Map<String, BankCredentials> banks = new LinkedHashMap<>();

    public Credentials credentials(SandboxBank bank) {
        BankCredentials configured = banks.get(bank.name().toLowerCase());
        if (configured == null) configured = banks.get(bank.name());
        return new Credentials(
                valueOr(configured == null ? null : configured.getClientId(), sandboxClientId + "-" + bank.idPrefix()),
                valueOr(configured == null ? null : configured.getClientSecret(), sandboxClientSecret),
                valueOr(configured == null ? null : configured.getCallbackSecret(), sandboxCallbackSecret));
    }

    private String valueOr(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    @Data
    public static class BankCredentials {
        private String clientId;
        private String clientSecret;
        private String callbackSecret;
    }

    public record Credentials(String clientId, String clientSecret, String callbackSecret) {}
}
