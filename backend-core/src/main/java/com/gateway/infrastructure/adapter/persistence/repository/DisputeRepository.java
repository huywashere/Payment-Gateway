package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.DisputeEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DisputeRepository extends JpaRepository<DisputeEntity, UUID> {
    List<DisputeEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);
    Optional<DisputeEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
    long countByStatusIn(List<String> statuses);
}
