package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.SettlementItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SettlementItemRepository extends JpaRepository<SettlementItemEntity, UUID> {
    boolean existsByChargeId(UUID chargeId);
    List<SettlementItemEntity> findBySettlementId(UUID settlementId);
}
