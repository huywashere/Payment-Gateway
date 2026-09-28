package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.entity.PortalNotificationEntity;
import com.gateway.infrastructure.adapter.persistence.repository.PortalNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PortalNotificationService {
    private final PortalNotificationRepository repository;

    @Transactional(readOnly = true)
    public List<PortalNotificationEntity> list(UUID merchantId, int limit) {
        return repository.findByMerchantIdOrderByCreatedAtDesc(merchantId,
                PageRequest.of(0, Math.max(1, Math.min(limit, 100))));
    }

    @Transactional(readOnly = true)
    public long unreadCount(UUID merchantId) {
        return repository.countByMerchantIdAndReadAtIsNull(merchantId);
    }

    @Transactional
    public PortalNotificationEntity markRead(UUID merchantId, UUID id) {
        PortalNotificationEntity notification = repository.findByIdAndMerchantId(id, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (notification.getReadAt() == null) notification.setReadAt(OffsetDateTime.now(ZoneOffset.UTC));
        return repository.save(notification);
    }

    @Transactional
    public void markAllRead(UUID merchantId) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        repository.findByMerchantIdAndReadAtIsNull(merchantId).forEach(notification -> {
            notification.setReadAt(now);
            repository.save(notification);
        });
    }

    @Transactional
    public PortalNotificationEntity create(UUID merchantId, String type, String severity,
                                           String title, String message, String resourceType, String resourceId) {
        return repository.save(PortalNotificationEntity.builder()
                .merchantId(merchantId).type(type).severity(severity).title(title).message(message)
                .resourceType(resourceType).resourceId(resourceId).build());
    }
}
