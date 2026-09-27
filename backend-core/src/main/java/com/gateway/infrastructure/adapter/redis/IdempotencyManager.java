package com.gateway.infrastructure.adapter.redis;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.gateway.domain.exception.IdempotencyConflictException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RBucket;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Slf4j
@Component
@RequiredArgsConstructor
public class IdempotencyManager {

    private final RedissonClient redissonClient;
    private final ObjectMapper objectMapper;

    @Value("${gateway.idempotency.ttl-seconds:86400}")
    private long idempotencyTtlSeconds;

    @Value("${gateway.idempotency.lock-timeout-seconds:30}")
    private long lockTimeoutSeconds;

    /**
     * Executes the given supplier within a distributed idempotency boundary.
     * If the key is already resolved, returns the cached result.
     * If another thread/node is currently resolving it, throws 409 Conflict.
     */
    public <T> T execute(UUID merchantId, String idempotencyKey, Class<T> responseType, Supplier<T> operation) {
        return execute(merchantId, idempotencyKey, null, responseType, operation);
    }

    public <T> T execute(UUID merchantId, String idempotencyKey, String requestHash,
                         Class<T> responseType, Supplier<T> operation) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return operation.get();
        }
        if (idempotencyKey.length() > 255) {
            throw new IllegalArgumentException("Idempotency-Key must not exceed 255 characters");
        }

        String cacheKey = "result:idemp:" + merchantId + ":" + idempotencyKey;
        String lockKey = "lock:idemp:" + merchantId + ":" + idempotencyKey;

        // 1. Check if we already have a cached resolved response
        RBucket<String> cachedBucket = redissonClient.getBucket(cacheKey);
        String cachedValue = cachedBucket.get();
        if (cachedValue != null) {
            log.info("Idempotency HIT for key {}: Replaying cached response", idempotencyKey);
            return deserializeCached(cachedValue, requestHash, responseType);
        }

        // 2. Acquire Distributed Lock with 0 wait time to immediately reject concurrent double-clicks
        RLock lock = redissonClient.getLock(lockKey);
        boolean acquired = false;
        try {
            acquired = lock.tryLock(0, lockTimeoutSeconds, TimeUnit.SECONDS);
            if (!acquired) {
                log.warn("Concurrent duplicate request detected for idempotency key: {}", idempotencyKey);
                throw new IdempotencyConflictException(
                        "An operation with the key '" + idempotencyKey + "' is currently being processed. Please wait and do not retry immediately."
                );
            }

            // Double check cache after acquiring lock
            cachedValue = cachedBucket.get();
            if (cachedValue != null) {
                return deserializeCached(cachedValue, requestHash, responseType);
            }

            // 3. Execute business logic
            T result = operation.get();

            // 4. Save result to cache with TTL (24 hours)
            try {
                ObjectNode envelope = objectMapper.createObjectNode();
                if (requestHash != null) {
                    envelope.put("requestHash", requestHash);
                }
                envelope.set("response", objectMapper.valueToTree(result));
                String serialized = objectMapper.writeValueAsString(envelope);
                cachedBucket.set(serialized, Duration.ofSeconds(idempotencyTtlSeconds));
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize idempotency result", e);
            }

            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Thread interrupted while acquiring lock", e);
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    public String fingerprint(Object request) {
        try {
            byte[] serialized = objectMapper.writeValueAsBytes(request);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(serialized));
        } catch (JsonProcessingException | NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to fingerprint idempotent request", e);
        }
    }

    private <T> T deserializeCached(String cachedValue, String requestHash, Class<T> responseType) {
        try {
            JsonNode node = objectMapper.readTree(cachedValue);
            if (node.has("response")) {
                String storedHash = node.path("requestHash").asText(null);
                if (requestHash != null && storedHash != null && !MessageDigest.isEqual(
                        requestHash.getBytes(StandardCharsets.UTF_8), storedHash.getBytes(StandardCharsets.UTF_8))) {
                    throw new IdempotencyConflictException(
                            "The same Idempotency-Key was already used with different request parameters."
                    );
                }
                return objectMapper.treeToValue(node.get("response"), responseType);
            }
            // Backwards compatibility with cache records produced before the envelope existed.
            return objectMapper.treeToValue(node, responseType);
        } catch (IdempotencyConflictException e) {
            throw e;
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to deserialize cached idempotency response", e);
        }
    }
}
