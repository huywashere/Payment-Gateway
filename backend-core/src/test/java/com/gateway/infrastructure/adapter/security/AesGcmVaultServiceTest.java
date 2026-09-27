package com.gateway.infrastructure.adapter.security;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AesGcmVaultServiceTest {
    private static final String KEY = Base64.getEncoder().encodeToString(new byte[32]);

    @Test
    void encryptsVersionedAuthenticatedMetadata() {
        AesGcmVaultService vault = new AesGcmVaultService(KEY);
        String encrypted = vault.encrypt("{\"sandbox\":true}");

        assertThat(encrypted).startsWith("v1:");
        assertThat(vault.decrypt(encrypted)).isEqualTo("{\"sandbox\":true}");
    }

    @Test
    void rejectsInvalidKeyLengthInsteadOfPaddingIt() {
        String shortKey = Base64.getEncoder().encodeToString(new byte[16]);
        assertThatThrownBy(() -> new AesGcmVaultService(shortKey))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("exactly 32 bytes");
    }

    @Test
    void rejectsTamperedCiphertext() {
        AesGcmVaultService vault = new AesGcmVaultService(KEY);
        String encrypted = vault.encrypt("metadata");
        String tampered = encrypted.substring(0, encrypted.length() - 2) + "AA";

        assertThatThrownBy(() -> vault.decrypt(tampered))
                .isInstanceOf(RuntimeException.class);
    }
}
