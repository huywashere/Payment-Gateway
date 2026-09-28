package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.AcquirerOperationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AcquirerOperationRepository extends JpaRepository<AcquirerOperationEntity, UUID> {
    Optional<AcquirerOperationEntity> findByMerchantIdAndIdempotencyKey(UUID merchantId, String idempotencyKey);
    Optional<AcquirerOperationEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select operation from AcquirerOperationEntity operation where operation.id = :id and operation.merchantId = :merchantId")
    Optional<AcquirerOperationEntity> findOwnedForUpdate(@Param("id") UUID id, @Param("merchantId") UUID merchantId);
    List<AcquirerOperationEntity> findByPaymentIntentIdOrderByCreatedAtAsc(UUID paymentIntentId);
    List<AcquirerOperationEntity> findByParentOperationIdOrderByCreatedAtAsc(UUID parentOperationId);
}
