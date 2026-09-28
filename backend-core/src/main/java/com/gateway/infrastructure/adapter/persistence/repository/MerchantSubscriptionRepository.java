package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.MerchantSubscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MerchantSubscriptionRepository extends JpaRepository<MerchantSubscriptionEntity, UUID> {}
