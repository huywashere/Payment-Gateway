package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ChargeRepository extends JpaRepository<ChargeEntity, UUID> {
    List<ChargeEntity> findByPaymentIntentId(UUID paymentIntentId);
}
