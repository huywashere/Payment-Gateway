package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.BillingInvoiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillingInvoiceRepository extends JpaRepository<BillingInvoiceEntity, UUID> {
    List<BillingInvoiceEntity> findByMerchantIdOrderByIssuedAtDesc(UUID merchantId);
    Optional<BillingInvoiceEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
}
