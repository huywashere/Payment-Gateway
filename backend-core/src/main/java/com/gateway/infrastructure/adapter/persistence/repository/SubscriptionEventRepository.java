package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.SubscriptionEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SubscriptionEventRepository extends JpaRepository<SubscriptionEventEntity, UUID> {
    List<SubscriptionEventEntity> findTop50ByMerchantIdOrderByCreatedAtDesc(UUID merchantId);
}
