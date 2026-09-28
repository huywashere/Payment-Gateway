package com.gateway.application.service;

import com.gateway.application.dto.PaymentLinkResponse;
import com.gateway.application.event.PaymentLinkStatusChanged;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class PaymentLinkRealtimeService {
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> subscribers = new ConcurrentHashMap<>();

    public SseEmitter subscribe(PaymentLinkResponse initial) {
        SseEmitter emitter = new SseEmitter(30 * 60_000L);
        subscribers.computeIfAbsent(initial.getSlug(), ignored -> new CopyOnWriteArrayList<>()).add(emitter);
        Runnable remove = () -> remove(initial.getSlug(), emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(ignored -> remove.run());
        try {
            emitter.send(SseEmitter.event().name("payment_link.status").id(initial.getId().toString())
                    .data(Map.of("slug", initial.getSlug(), "status", initial.getStatus(),
                            "paidAt", initial.getPaidAt() == null ? "" : initial.getPaidAt().toString())));
        } catch (IOException exception) {
            remove.run();
            emitter.completeWithError(exception);
        }
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void statusChanged(PaymentLinkStatusChanged event) {
        broadcast(event.slug(), event.status(), event.paidAt());
    }

    @Scheduled(fixedDelay = 15_000)
    public void heartbeat() {
        subscribers.forEach((slug, emitters) -> emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().comment("heartbeat " + OffsetDateTime.now()));
            } catch (IOException exception) {
                remove(slug, emitter);
            }
        }));
    }

    private void broadcast(String slug, String status, OffsetDateTime paidAt) {
        var emitters = subscribers.get(slug);
        if (emitters == null) return;
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("payment_link.status")
                        .data(Map.of("slug", slug, "status", status,
                                "paidAt", paidAt == null ? "" : paidAt.toString())));
                if (!"OPEN".equals(status)) {
                    emitter.complete();
                    remove(slug, emitter);
                }
            } catch (IOException exception) {
                remove(slug, emitter);
            }
        }
        log.debug("Published payment link status {} to {} subscriber(s)", status, emitters.size());
    }

    private void remove(String slug, SseEmitter emitter) {
        var emitters = subscribers.get(slug);
        if (emitters == null) return;
        emitters.remove(emitter);
        if (emitters.isEmpty()) subscribers.remove(slug, emitters);
    }
}
