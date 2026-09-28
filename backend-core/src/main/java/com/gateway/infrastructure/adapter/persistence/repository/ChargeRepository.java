package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.OffsetDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ChargeRepository extends JpaRepository<ChargeEntity, UUID> {
    List<ChargeEntity> findByPaymentIntentId(UUID paymentIntentId);
    Page<ChargeEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);
    Optional<ChargeEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
    Optional<ChargeEntity> findByMerchantIdAndProcessorTxId(UUID merchantId, String processorTxId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM ChargeEntity c WHERE c.processorTxId = :processorTxId")
    Optional<ChargeEntity> findByProcessorTxIdForUpdate(@Param("processorTxId") String processorTxId);
    List<ChargeEntity> findByMerchantIdAndStatusInAndCreatedAtLessThanEqualOrderByCreatedAtAsc(
            UUID merchantId, List<String> statuses, OffsetDateTime cutoff);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM ChargeEntity c WHERE c.merchantId = :merchantId AND c.status IN :statuses " +
            "AND c.createdAt <= :cutoff ORDER BY c.createdAt ASC")
    List<ChargeEntity> findEligibleForSettlement(@Param("merchantId") UUID merchantId,
                                                  @Param("statuses") List<String> statuses,
                                                  @Param("cutoff") OffsetDateTime cutoff);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM ChargeEntity c WHERE c.id = :id AND c.merchantId = :merchantId")
    Optional<ChargeEntity> findOwnedForUpdate(@Param("id") UUID id, @Param("merchantId") UUID merchantId);
    List<ChargeEntity> findByMerchantIdAndProcessorCodeAndCreatedAtBetweenOrderByCreatedAtAsc(
            UUID merchantId, String processorCode, OffsetDateTime periodStart, OffsetDateTime periodEnd);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM ChargeEntity c WHERE c.merchantId = :merchantId " +
            "AND c.status IN ('SUCCEEDED', 'PARTIALLY_REFUNDED', 'REFUNDED') AND c.createdAt >= :after")
    Long sumCapturedAmountAfter(@Param("merchantId") UUID merchantId, @Param("after") OffsetDateTime after);
}
