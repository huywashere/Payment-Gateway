package com.gateway.infrastructure.adapter.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "gateway.security.vault-provider", havingValue = "environment", matchIfMissing = true)
public class AesGcmVaultService implements PaymentMetadataVault {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int TAG_LENGTH_BIT = 128;
    private static final int IV_LENGTH_BYTE = 12;
    private static final String ENVELOPE_VERSION = "v1:";
    private static final byte[] METADATA_AAD = "payment-method-metadata:v1".getBytes(StandardCharsets.UTF_8);

    private final SecretKey masterKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesGcmVaultService(@Value("${gateway.security.card-vault-master-key}") String base64MasterKey) {
        final byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(base64MasterKey);
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("GATEWAY_VAULT_KEY must be valid Base64", exception);
        }
        if (decoded.length != 32) {
            throw new IllegalStateException("GATEWAY_VAULT_KEY must decode to exactly 32 bytes");
        }
        this.masterKey = new SecretKeySpec(decoded, "AES");
    }

    @Override
    public String encrypt(String plainText) {
        try {
            byte[] iv = new byte[IV_LENGTH_BYTE];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.ENCRYPT_MODE, masterKey, parameterSpec);
            cipher.updateAAD(METADATA_AAD);

            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            // Prefix IV to cipherText: [IV (12 bytes)][CipherText + AuthTag]
            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + cipherText.length);
            byteBuffer.put(iv);
            byteBuffer.put(cipherText);

            return ENVELOPE_VERSION + Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt data inside Card Vault", e);
        }
    }

    @Override
    public String decrypt(String base64CipherTextWithIv) {
        try {
            boolean versioned = base64CipherTextWithIv.startsWith(ENVELOPE_VERSION);
            String encoded = versioned
                    ? base64CipherTextWithIv.substring(ENVELOPE_VERSION.length())
                    : base64CipherTextWithIv;
            byte[] cipherMessage = Base64.getDecoder().decode(encoded);
            if (cipherMessage.length <= IV_LENGTH_BYTE + 16) {
                throw new IllegalArgumentException("Ciphertext envelope is too short");
            }
            ByteBuffer byteBuffer = ByteBuffer.wrap(cipherMessage);

            byte[] iv = new byte[IV_LENGTH_BYTE];
            byteBuffer.get(iv);

            byte[] cipherText = new byte[byteBuffer.remaining()];
            byteBuffer.get(cipherText);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(TAG_LENGTH_BIT, iv);
            cipher.init(Cipher.DECRYPT_MODE, masterKey, parameterSpec);
            if (versioned) cipher.updateAAD(METADATA_AAD);

            byte[] plainTextBytes = cipher.doFinal(cipherText);
            return new String(plainTextBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Failed to decrypt data from Card Vault", e);
        }
    }

    public String generateVaultToken() {
        return "pm_card_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
    }
}
