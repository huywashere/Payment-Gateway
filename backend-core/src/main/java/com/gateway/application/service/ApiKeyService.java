package com.gateway.application.service;

import com.gateway.application.dto.ApiKeyResponse;
import com.gateway.application.dto.CreateApiKeyRequest;
import com.gateway.infrastructure.adapter.persistence.entity.ApiKeyEntity;
import com.gateway.infrastructure.adapter.persistence.repository.ApiKeyRepository;
import com.gateway.infrastructure.adapter.security.ApiKeyHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ApiKeyService {
    private static final Set<String> ALLOWED_SCOPES = Set.of(
            "payments:read", "payments:write", "refunds:write", "balance:read",
            "webhooks:write", "keys:write", "audit:read", "payment_methods:write",
            "settlements:read", "settlements:write", "payouts:read", "payouts:write",
            "disputes:read", "disputes:write", "risk:read", "risk:write", "reconciliation:read",
            "customers:write"
    );
    private final ApiKeyRepository repository;
    private final ApiKeyHasher hasher;
    private final AuditService auditService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public ApiKeyResponse create(UUID merchantId, CreateApiKeyRequest request, String actor) {
        String type = normalizeType(request.getKeyType());
        String environment = normalizeEnvironment(request.getEnvironment());
        Set<String> scopes = normalizeScopes(type, request.getScopes());
        String rawKey = generateRawKey(type, environment);
        ApiKeyEntity entity = repository.save(ApiKeyEntity.builder()
                .merchantId(merchantId)
                .keyPrefix(rawKey.substring(0, Math.min(16, rawKey.length())))
                .secretHash(hasher.hashApiKey(rawKey))
                .keyType(type)
                .environment(environment)
                .displayName(request.getDisplayName().trim())
                .scopes(String.join(",", scopes))
                .isActive(true)
                .build());
        auditService.record(merchantId, "API_KEY", actor, "api_key.created", "api_key",
                entity.getId().toString(), Map.of("display_name", entity.getDisplayName(), "scopes", scopes));
        return toResponse(entity, rawKey);
    }

    @Transactional(readOnly = true)
    public List<ApiKeyResponse> list(UUID merchantId) {
        return repository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream()
                .map(entity -> toResponse(entity, null)).toList();
    }

    @Transactional
    public ApiKeyResponse rotate(UUID merchantId, UUID keyId, String actor) {
        ApiKeyEntity current = ownedKey(merchantId, keyId);
        if (!Boolean.TRUE.equals(current.getIsActive())) throw new IllegalStateException("API key is already inactive");
        current.setIsActive(false);
        current.setRevokedAt(OffsetDateTime.now());
        repository.save(current);
        CreateApiKeyRequest replacement = CreateApiKeyRequest.builder()
                .displayName(current.getDisplayName() + " (rotated)")
                .keyType(current.getKeyType())
                .environment(current.getEnvironment())
                .scopes(parseScopes(current.getScopes()))
                .build();
        return create(merchantId, replacement, actor);
    }

    @Transactional
    public void revoke(UUID merchantId, UUID keyId, String actor) {
        ApiKeyEntity key = ownedKey(merchantId, keyId);
        key.setIsActive(false);
        key.setRevokedAt(OffsetDateTime.now());
        repository.save(key);
        auditService.record(merchantId, "API_KEY", actor, "api_key.revoked", "api_key",
                keyId.toString(), Map.of("display_name", key.getDisplayName()));
    }

    private ApiKeyEntity ownedKey(UUID merchantId, UUID keyId) {
        return repository.findByIdAndMerchantId(keyId, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("API key not found"));
    }

    private String generateRawKey(String type, String environment) {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        String prefix = "SECRET".equals(type) ? "sk" : "pk";
        return prefix + "_" + environment.toLowerCase(Locale.ROOT) + "_" +
                Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String normalizeType(String value) {
        String result = value == null ? "SECRET" : value.toUpperCase(Locale.ROOT);
        if (!Set.of("SECRET", "PUBLISHABLE").contains(result)) throw new IllegalArgumentException("Unsupported API key type");
        return result;
    }

    private String normalizeEnvironment(String value) {
        String result = value == null ? "TEST" : value.toUpperCase(Locale.ROOT);
        if (!Set.of("TEST", "LIVE").contains(result)) throw new IllegalArgumentException("Unsupported API key environment");
        return result;
    }

    private Set<String> normalizeScopes(String type, Set<String> requested) {
        Set<String> defaults = "PUBLISHABLE".equals(type)
                ? Set.of("payment_methods:write")
                : Set.of("payments:read", "payments:write", "refunds:write", "balance:read", "webhooks:write",
                        "keys:write", "audit:read", "settlements:read", "settlements:write", "payouts:read",
                        "payouts:write", "disputes:read", "disputes:write", "risk:read", "risk:write",
                        "reconciliation:read", "customers:write");
        Set<String> result = requested == null || requested.isEmpty() ? defaults : new TreeSet<>(requested);
        if (!ALLOWED_SCOPES.containsAll(result)) throw new IllegalArgumentException("One or more API key scopes are unsupported");
        if ("PUBLISHABLE".equals(type) && !Set.of("payment_methods:write").containsAll(result)) {
            throw new IllegalArgumentException("Publishable keys can only tokenize sandbox payment methods");
        }
        return result;
    }

    public static Set<String> parseScopes(String scopes) {
        if (scopes == null || scopes.isBlank()) return Set.of();
        return new TreeSet<>(Arrays.asList(scopes.split(",")));
    }

    private ApiKeyResponse toResponse(ApiKeyEntity entity, String rawSecret) {
        return ApiKeyResponse.builder().id(entity.getId()).object("api_key")
                .displayName(entity.getDisplayName()).keyPrefix(entity.getKeyPrefix())
                .keyType(entity.getKeyType()).environment(entity.getEnvironment())
                .scopes(parseScopes(entity.getScopes())).active(entity.getIsActive())
                .secret(rawSecret).createdAt(entity.getCreatedAt()).lastUsedAt(entity.getLastUsedAt()).build();
    }
}
