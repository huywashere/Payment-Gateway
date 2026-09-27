package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.RefundEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefundRepository extends JpaRepository<RefundEntity, UUID> {
    Optional<RefundEntity> findByMerchantIdAndIdempotencyKey(UUID merchantId, String idempotencyKey);
    List<RefundEntity> findByChargeIdOrderByCreatedAtDesc(UUID chargeId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM RefundEntity r WHERE r.chargeId = :chargeId AND r.status = 'SUCCEEDED'")
    Long totalSucceededForCharge(@Param("chargeId") UUID chargeId);
}

