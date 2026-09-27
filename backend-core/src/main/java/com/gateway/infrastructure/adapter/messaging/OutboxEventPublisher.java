package com.gateway.infrastructure.adapter.messaging;

import com.gateway.infrastructure.adapter.persistence.entity.OutboxEventEntity;
import com.gateway.infrastructure.adapter.persistence.repository.OutboxEventRepository;
import com.gateway.infrastructure.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxEventPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;

    @Scheduled(fixedDelay = 3000)
    @Transactional
    public void publishPendingEvents() {
        List<OutboxEventEntity> pendingEvents = outboxEventRepository.findPendingEvents();
        if (pendingEvents.isEmpty()) {
            return;
        }

        log.info("[OutboxWorker] Found {} pending outbox event(s) to publish to RabbitMQ", pendingEvents.size());

        for (OutboxEventEntity event : pendingEvents) {
            try {
                String routingKey = "payment.event." + (event.getEventType() != null ? event.getEventType().replace(".", "_") : "general");
                
                String messageBody = String.format("{\"outboxEventId\": \"%s\", \"eventType\": \"%s\", \"payload\": %s}",
                        event.getId(), event.getEventType(), event.getPayload());

                rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, routingKey, messageBody);

                event.setStatus("PUBLISHED");
                outboxEventRepository.save(event);
                log.info("[OutboxWorker] Published event ID: {} ({}) to exchange '{}' with routingKey '{}'",
                        event.getId(), event.getEventType(), RabbitMQConfig.EXCHANGE_NAME, routingKey);
            } catch (Exception e) {
                log.error("[OutboxWorker] Failed to publish event ID: {}: {}", event.getId(), e.getMessage());
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus("FAILED");
                }
                outboxEventRepository.save(event);
            }
        }
    }
}
