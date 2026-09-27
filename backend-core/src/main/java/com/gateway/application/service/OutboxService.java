package com.gateway.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.infrastructure.adapter.persistence.entity.OutboxEventEntity;
import com.gateway.infrastructure.adapter.persistence.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OutboxService {
    private final OutboxEventRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.MANDATORY)
    public OutboxEventEntity enqueue(UUID merchantId, String aggregateType, UUID aggregateId,
                                     String eventType, Map<String, Object> data) {
        try {
            UUID eventId = UUID.randomUUID();
            Map<String, Object> envelope = new LinkedHashMap<>();
            envelope.put("id", eventId.toString());
            envelope.put("object", "event");
            envelope.put("type", eventType);
            envelope.put("created", Instant.now().getEpochSecond());
            envelope.put("merchant_id", merchantId.toString());
            envelope.put("data", Map.of("object", data));
            return repository.save(OutboxEventEntity.builder()
                    .id(eventId)
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .eventType(eventType)
                    .payload(objectMapper.writeValueAsString(envelope))
                    .status("PENDING")
                    .build());
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialize outbox event", e);
        }
    }
}
