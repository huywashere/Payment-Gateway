package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.BankTransactionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BankTransactionRepository extends JpaRepository<BankTransactionEntity, UUID> {
    Optional<BankTransactionEntity> findByBankAccountIdAndExternalReference(UUID bankAccountId, String externalReference);
    Optional<BankTransactionEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
    Page<BankTransactionEntity> findByMerchantIdOrderByReceivedAtDesc(UUID merchantId, Pageable pageable);
}
