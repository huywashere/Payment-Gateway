package com.gateway.application.event;

import java.time.OffsetDateTime;

public record PaymentLinkStatusChanged(String slug, String status, OffsetDateTime paidAt) {
}
