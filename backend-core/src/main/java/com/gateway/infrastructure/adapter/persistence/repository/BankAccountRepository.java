package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.BankAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BankAccountRepository extends JpaRepository<BankAccountEntity, UUID> {
    List<BankAccountEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId);
    Optional<BankAccountEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
    Optional<BankAccountEntity> findFirstByMerchantIdAndDefaultAccountTrueAndStatus(UUID merchantId, String status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<BankAccountEntity> findForUpdateById(UUID id);
    long countByMerchantIdAndStatusNot(UUID merchantId, String status);
}
