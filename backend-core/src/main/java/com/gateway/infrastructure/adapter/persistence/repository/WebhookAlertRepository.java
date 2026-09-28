package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.WebhookAlertEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
import java.util.List;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WebhookAlertRepository extends JpaRepository<WebhookAlertEntity, UUID> {
    List<WebhookAlertEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId);

    @Query(value = "SELECT * FROM webhook_alerts WHERE status = 'PENDING' AND created_at <= :now " +
            "ORDER BY created_at ASC LIMIT 25 FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<WebhookAlertEntity> findPending(@Param("now") OffsetDateTime now);
}
