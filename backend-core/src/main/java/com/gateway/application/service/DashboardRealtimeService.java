package com.gateway.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class DashboardRealtimeService {
    private final DashboardAnalyticsService analyticsService;
    private final Map<UUID, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID merchantId) {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.computeIfAbsent(merchantId, ignored -> new CopyOnWriteArrayList<>()).add(emitter);
        Runnable cleanup = () -> remove(merchantId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(ignored -> cleanup.run());
        send(merchantId, emitter, "snapshot");
        return emitter;
    }

    @Scheduled(fixedDelayString = "${gateway.dashboard.realtime-interval-ms:5000}")
    public void broadcast() {
        emitters.forEach((merchantId, clients) -> new ArrayList<>(clients)
                .forEach(emitter -> send(merchantId, emitter, "snapshot")));
    }

    private void send(UUID merchantId, SseEmitter emitter, String event) {
        try {
            emitter.send(SseEmitter.event().name(event).data(analyticsService.overview(merchantId, 30)));
        } catch (IOException | RuntimeException exception) {
            emitter.complete();
            remove(merchantId, emitter);
        }
    }

    private void remove(UUID merchantId, SseEmitter emitter) {
        List<SseEmitter> clients = emitters.get(merchantId);
        if (clients == null) return;
        clients.remove(emitter);
        if (clients.isEmpty()) emitters.remove(merchantId);
    }
}
