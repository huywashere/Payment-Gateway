package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.PaymentLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentLinkRepository extends JpaRepository<PaymentLinkEntity, UUID> {
    Optional<PaymentLinkEntity> findBySlug(String slug);
    Optional<PaymentLinkEntity> findByPaymentIntentId(UUID paymentIntentId);
    List<PaymentLinkEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId);
    List<PaymentLinkEntity> findByBankAccountIdAndStatusAndExpiresAtAfter(UUID bankAccountId, String status, OffsetDateTime now);
}
