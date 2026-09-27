package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.ReconciliationRunEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ReconciliationRunRepository extends JpaRepository<ReconciliationRunEntity, UUID> {
    List<ReconciliationRunEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);
    long countByStatus(String status);
}
