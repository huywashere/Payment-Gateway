package com.gateway.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.infrastructure.adapter.persistence.entity.AuditLogEntity;
import com.gateway.infrastructure.adapter.persistence.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.MANDATORY)
    public void record(UUID merchantId, String actorType, String actorId, String action,
                       String resourceType, String resourceId, Map<String, Object> details) {
        String json = null;
        try {
            if (details != null) json = objectMapper.writeValueAsString(details);
        } catch (JsonProcessingException ignored) {
            json = "{\"serialization_error\":true}";
        }
        auditLogRepository.save(AuditLogEntity.builder()
                .merchantId(merchantId)
                .actorType(actorType)
                .actorId(actorId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .requestId(MDC.get("requestId"))
                .details(json)
                .build());
    }
}

