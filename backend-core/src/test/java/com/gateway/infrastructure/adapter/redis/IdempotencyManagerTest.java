package com.gateway.infrastructure.adapter.redis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.domain.exception.IdempotencyConflictException;
import com.gateway.infrastructure.adapter.persistence.entity.IdempotencyRecordEntity;
import com.gateway.infrastructure.adapter.persistence.repository.IdempotencyRecordRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class IdempotencyManagerTest {
    private final RedissonClient redisson = mock(RedissonClient.class);
    private final IdempotencyRecordRepository repository = mock(IdempotencyRecordRepository.class);
    private final RBucket<String> bucket = mock(RBucket.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private IdempotencyManager manager;

    @BeforeEach
    void setUp() {
        manager = new IdempotencyManager(redisson, objectMapper, repository);
        when(redisson.<String>getBucket(anyString())).thenReturn(bucket);
        when(bucket.get()).thenReturn(null);
    }

    @Test
    void replaysCompletedDatabaseRecordWhenRedisCacheWasLost() {
        UUID merchantId = UUID.randomUUID();
        when(repository.findByMerchantIdAndIdempotencyKey(merchantId, "order-42"))
                .thenReturn(Optional.of(completed(merchantId, "order-42", "hash-a", "{\"status\":\"paid\"}")));
        AtomicBoolean executed = new AtomicBoolean(false);

        Result response = manager.execute(merchantId, "order-42", "hash-a", Result.class, () -> {
            executed.set(true);
            return new Result("duplicate");
        });

        assertThat(response.status()).isEqualTo("paid");
        assertThat(executed).isFalse();
    }

    @Test
    void rejectsKeyReuseWithDifferentRequestAfterRedisLoss() {
        UUID merchantId = UUID.randomUUID();
        when(repository.findByMerchantIdAndIdempotencyKey(merchantId, "order-42"))
                .thenReturn(Optional.of(completed(merchantId, "order-42", "hash-a", "{\"status\":\"paid\"}")));

        assertThatThrownBy(() -> manager.execute(
                merchantId, "order-42", "hash-b", Result.class, () -> new Result("duplicate")))
                .isInstanceOf(IdempotencyConflictException.class);
    }

    private IdempotencyRecordEntity completed(UUID merchantId, String key, String hash, String payload) {
        return IdempotencyRecordEntity.builder()
                .merchantId(merchantId)
                .idempotencyKey(key)
                .requestHash(hash)
                .responseType(Result.class.getName())
                .responsePayload(payload)
                .status("COMPLETED")
                .build();
    }

    private record Result(String status) {}
}
