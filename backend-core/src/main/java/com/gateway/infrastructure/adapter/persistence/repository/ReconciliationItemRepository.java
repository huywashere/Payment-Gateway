package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.ReconciliationItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ReconciliationItemRepository extends JpaRepository<ReconciliationItemEntity, UUID> {
    List<ReconciliationItemEntity> findByRunIdOrderByCreatedAtAsc(UUID runId);
}
