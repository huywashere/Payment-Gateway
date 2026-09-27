package com.gateway.infrastructure.adapter.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HmacSignerTest {

    private final HmacSigner signer = new HmacSigner();

    @Test
    void signsAndVerifiesWebhookPayload() {
        String payload = "{\"type\":\"payment_intent.succeeded\"}";
        String signature = signer.generateWebhookSignature(payload, "whsec_test_secret");

        assertThat(signature).matches("t=\\d+,v1=[0-9a-f]{64}");
        assertThat(signer.verifySignature(payload, signature, "whsec_test_secret", 300)).isTrue();
        assertThat(signer.verifySignature(payload + " ", signature, "whsec_test_secret", 300)).isFalse();
    }

    @Test
    void rejectsMalformedHeader() {
        assertThat(signer.verifySignature("{}", "invalid", "whsec_test_secret", 300)).isFalse();
    }
}
