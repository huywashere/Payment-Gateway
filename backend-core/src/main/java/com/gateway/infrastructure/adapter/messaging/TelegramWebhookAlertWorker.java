package com.gateway.infrastructure.adapter.messaging;

import com.gateway.application.service.PortalNotificationService;
import com.gateway.infrastructure.adapter.persistence.repository.WebhookAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "gateway.webhooks.alert-provider", havingValue = "telegram")
public class TelegramWebhookAlertWorker {
    private final WebhookAlertRepository repository;
    private final PortalNotificationService notificationService;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${gateway.webhooks.telegram.bot-token:}")
    private String botToken;

    @Value("${gateway.webhooks.telegram.chat-id:}")
    private String chatId;

    @Scheduled(fixedDelayString = "${gateway.webhooks.alert-poll-interval-ms:3000}")
    @Transactional
    public void deliver() {
        var pending = repository.findPending(OffsetDateTime.now());
        for (var alert : pending) {
            String text = formatTelegramMessage(alert.getMerchantId().toString(),
                    alert.getEndpointId().toString(),
                    mask(alert.getDestination()),
                    alert.getChannel(),
                    alert.getMessage());

            if (botToken != null && !botToken.isBlank() && chatId != null && !chatId.isBlank()) {
                sendToTelegram(text);
            } else {
                log.info("[Telegram Alert Worker - Simulation Mode] No token configured. Alert text:\n{}", text);
            }

            alert.setStatus("SENT");
            alert.setSentAt(OffsetDateTime.now());
            repository.save(alert);

            notificationService.create(alert.getMerchantId(), "WEBHOOK_ALERT", "WARNING",
                    "Cảnh báo Webhook gửi qua Telegram", alert.getMessage(),
                    "webhook_endpoint", alert.getEndpointId().toString());
        }
    }

    private void sendToTelegram(String message) {
        try {
            String url = "https://api.telegram.org/bot" + botToken.trim() + "/sendMessage";
            String jsonPayload = String.format("{\"chat_id\":\"%s\",\"text\":\"%s\",\"parse_mode\":\"Markdown\"}",
                    escapeJson(chatId.trim()), escapeJson(message));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Telegram webhook alert dispatched successfully");
            } else {
                log.warn("Telegram API returned non-200 status: {} response: {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send alert to Telegram: {}", e.getMessage());
        }
    }

    private String formatTelegramMessage(String merchantId, String endpointId, String destination, String channel, String reason) {
        return String.format(
                "🚨 *[NOVAGATE ALERT]* Webhook DLQ Failure!\n" +
                "-----------------------------------------\n" +
                "• *Merchant:* `%s`\n" +
                "• *Endpoint:* `%s`\n" +
                "• *Channel:* %s (%s)\n" +
                "• *Time:* %s\n" +
                "• *Error:* %s\n" +
                "-----------------------------------------\n" +
                "👉 _Vui lòng kiểm tra Merchant Portal để Replay Webhook._",
                merchantId, endpointId, channel, destination,
                OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME),
                reason
        );
    }

    private String mask(String value) {
        if (value == null || value.length() < 5) return "***";
        return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "");
    }
}
