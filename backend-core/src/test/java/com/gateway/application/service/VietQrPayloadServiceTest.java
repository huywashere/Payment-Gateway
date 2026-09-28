package com.gateway.application.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class VietQrPayloadServiceTest {
    private final VietQrPayloadService service = new VietQrPayloadService();

    @Test
    void generatesDynamicVietQrPayloadWithValidCrc() {
        String payload = service.generate("970416", "24550721", 250000, "PAYABC123");

        assertThat(payload).startsWith("000201010212");
        assertThat(payload).contains("A000000727", "QRIBFTTA", "970416", "24550721", "250000", "PAYABC123");
        assertThat(payload.substring(payload.length() - 8, payload.length() - 4)).isEqualTo("6304");
        assertThat(service.hasValidCrc(payload)).isTrue();
        assertThat(service.hasValidCrc(payload.substring(0, payload.length() - 1) + "0")).isFalse();
    }

    @Test
    void rejectsInvalidBankBinAndOversizedPaymentCode() {
        assertThatThrownBy(() -> service.generate("ACB", "24550721", 1000, "PAY1"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.generate("970416", "24550721", 1000, "PAY12345678901234567890123456"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
