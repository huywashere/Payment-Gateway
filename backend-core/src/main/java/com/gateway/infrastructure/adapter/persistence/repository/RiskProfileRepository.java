package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.RiskProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface RiskProfileRepository extends JpaRepository<RiskProfileEntity, UUID> {}
