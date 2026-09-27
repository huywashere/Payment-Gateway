package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import java.time.OffsetDateTime;

public interface PaymentIntentRepository extends JpaRepository<PaymentIntentEntity, UUID> {
    Optional<PaymentIntentEntity> findByClientSecret(String clientSecret);
    Optional<PaymentIntentEntity> findByIdempotencyKeyAndMerchantId(String idempotencyKey, UUID merchantId);
    Page<PaymentIntentEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);
    long countByMerchantIdAndCreatedAtAfter(UUID merchantId, OffsetDateTime after);
}
