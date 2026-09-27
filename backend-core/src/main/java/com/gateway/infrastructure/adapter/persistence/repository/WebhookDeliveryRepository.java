package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.WebhookDeliveryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WebhookDeliveryRepository extends JpaRepository<WebhookDeliveryEntity, UUID> {
    Page<WebhookDeliveryEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);

    @Query(value = "SELECT * FROM webhook_deliveries WHERE status IN ('PENDING', 'RETRYING') " +
            "AND (next_attempt_at IS NULL OR next_attempt_at <= :now) ORDER BY created_at ASC " +
            "LIMIT 25 FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<WebhookDeliveryEntity> findDueDeliveries(@Param("now") OffsetDateTime now);

    java.util.Optional<WebhookDeliveryEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
    boolean existsByEventIdAndEndpointId(UUID eventId, UUID endpointId);
    long countByStatus(String status);
}
