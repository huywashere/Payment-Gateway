package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.PortalNotificationEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PortalNotificationRepository extends JpaRepository<PortalNotificationEntity, UUID> {
    List<PortalNotificationEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);
    Optional<PortalNotificationEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
    long countByMerchantIdAndReadAtIsNull(UUID merchantId);
    List<PortalNotificationEntity> findByMerchantIdAndReadAtIsNull(UUID merchantId);
}
