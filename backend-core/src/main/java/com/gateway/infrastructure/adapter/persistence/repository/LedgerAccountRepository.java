package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.LedgerAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface LedgerAccountRepository extends JpaRepository<LedgerAccountEntity, UUID> {
    Optional<LedgerAccountEntity> findByAccountCode(String accountCode);
    Optional<LedgerAccountEntity> findByMerchantIdAndAccountCode(UUID merchantId, String accountCode);
    Optional<LedgerAccountEntity> findFirstByMerchantIdAndAccountTypeAndCurrencyOrderByCreatedAtAsc(
            UUID merchantId, String accountType, String currency);
    Optional<LedgerAccountEntity> findFirstByMerchantIdAndAccountCodeStartingWith(UUID merchantId, String prefix);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM LedgerAccountEntity a WHERE a.merchantId = :merchantId AND a.accountCode LIKE CONCAT(:prefix, '%')")
    Optional<LedgerAccountEntity> findMerchantAccountForUpdate(@Param("merchantId") UUID merchantId,
                                                                @Param("prefix") String prefix);
}
