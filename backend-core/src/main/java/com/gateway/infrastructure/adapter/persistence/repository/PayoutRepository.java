package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.PayoutEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PayoutRepository extends JpaRepository<PayoutEntity, UUID> {
    Optional<PayoutEntity> findByMerchantIdAndIdempotencyKey(UUID merchantId, String idempotencyKey);
    List<PayoutEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);
}
