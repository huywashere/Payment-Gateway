package com.gateway.infrastructure.adapter.processor;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class SandboxAcquirerProcessorTest {
    private final SandboxAcquirerProcessor processor = new SandboxAcquirerProcessor();

    @Test
    void authorizationCanRequireThreeDs() {
        var result = processor.execute(new AcquirerProcessor.AcquirerCommand(
                UUID.randomUUID(), UUID.randomUUID(), "AUTHORIZE", 200000, "VND", "success", true));

        assertThat(result.status()).isEqualTo("REQUIRES_ACTION");
        assertThat(result.threeDsVersion()).isEqualTo("2.2.0");
        assertThat(result.actionUrl()).startsWith("/3ds/sandbox/");
    }

    @Test
    void modelsSuccessAndDeclineWithoutCallingExternalNetwork() {
        var capture = processor.execute(new AcquirerProcessor.AcquirerCommand(
                UUID.randomUUID(), UUID.randomUUID(), "CAPTURE", 200000, "VND", "success", false));
        var decline = processor.execute(new AcquirerProcessor.AcquirerCommand(
                UUID.randomUUID(), UUID.randomUUID(), "AUTHORIZE", 200000, "VND", "declined", false));

        assertThat(capture.status()).isEqualTo("CAPTURED");
        assertThat(decline.status()).isEqualTo("FAILED");
        assertThat(decline.failureCode()).isEqualTo("card_declined");
    }
}
