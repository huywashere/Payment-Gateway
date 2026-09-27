package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.WebhookEndpointEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WebhookEndpointRepository extends JpaRepository<WebhookEndpointEntity, UUID> {
    List<WebhookEndpointEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId);
    List<WebhookEndpointEntity> findByMerchantIdAndStatus(UUID merchantId, String status);
    Optional<WebhookEndpointEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
}

