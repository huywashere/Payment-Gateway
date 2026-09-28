package com.gateway.infrastructure.adapter.persistence.repository;

import com.gateway.infrastructure.adapter.persistence.entity.OrganizationMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMemberEntity, UUID> {
    List<OrganizationMemberEntity> findByMerchantIdOrderByInvitedAtDesc(UUID merchantId);
    Optional<OrganizationMemberEntity> findByIdAndMerchantId(UUID id, UUID merchantId);
    long countByMerchantIdAndRoleAndStatus(UUID merchantId, String role, String status);
}
