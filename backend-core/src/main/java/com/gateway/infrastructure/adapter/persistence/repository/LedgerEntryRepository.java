package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.LedgerEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntryEntity, UUID> {
    List<LedgerEntryEntity> findByChargeId(UUID chargeId);
    List<LedgerEntryEntity> findByRefundId(UUID refundId);
    List<LedgerEntryEntity> findBySettlementId(UUID settlementId);
    List<LedgerEntryEntity> findByPayoutId(UUID payoutId);
    List<LedgerEntryEntity> findByDisputeId(UUID disputeId);

    @Query("SELECT COALESCE(SUM(CASE WHEN e.creditAccountId = :accountId THEN e.amount ELSE -e.amount END), 0) " +
           "FROM LedgerEntryEntity e WHERE e.creditAccountId = :accountId OR e.debitAccountId = :accountId")
    Long calculateAccountBalance(@Param("accountId") UUID accountId);
}
