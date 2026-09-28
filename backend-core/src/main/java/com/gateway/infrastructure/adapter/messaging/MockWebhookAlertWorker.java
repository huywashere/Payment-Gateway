package com.gateway.infrastructure.adapter.messaging;

import com.gateway.infrastructure.adapter.persistence.repository.WebhookAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "gateway.webhooks.alert-provider", havingValue = "mock", matchIfMissing = true)
public class MockWebhookAlertWorker {
    private final WebhookAlertRepository repository;

    @Scheduled(fixedDelayString = "${gateway.webhooks.alert-poll-interval-ms:3000}")
    @Transactional
    public void deliver() {
        for (var alert : repository.findPending(OffsetDateTime.now())) {
            log.info("Mock {} alert delivered to {} for endpoint {}: {}",
                    alert.getChannel(), mask(alert.getDestination()), alert.getEndpointId(), alert.getMessage());
            alert.setStatus("SENT");
            alert.setSentAt(OffsetDateTime.now());
            repository.save(alert);
        }
    }

    private String mask(String value) {
        if (value == null || value.length() < 5) return "***";
        return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
    }
}
