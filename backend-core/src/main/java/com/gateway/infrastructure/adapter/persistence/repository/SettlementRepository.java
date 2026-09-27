package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.SettlementEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SettlementRepository extends JpaRepository<SettlementEntity, UUID> {
    Optional<SettlementEntity> findByMerchantIdAndIdempotencyKey(UUID merchantId, String idempotencyKey);
    List<SettlementEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);
}
