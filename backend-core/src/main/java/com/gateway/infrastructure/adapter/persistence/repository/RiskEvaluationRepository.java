package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.RiskEvaluationEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RiskEvaluationRepository extends JpaRepository<RiskEvaluationEntity, UUID> {
    List<RiskEvaluationEntity> findByMerchantIdOrderByCreatedAtDesc(UUID merchantId, Pageable pageable);
}
