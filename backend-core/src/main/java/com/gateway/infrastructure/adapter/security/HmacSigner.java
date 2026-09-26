package com.gateway.infrastructure.adapter.security;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

@Component
public class HmacSigner {

    private static final String HMAC_SHA256 = "HmacSHA256";

    /**
     * Signs a webhook payload using Stripe's format:
     * Header value: t=1727354400,v1=6a39281...
     */
    public String generateWebhookSignature(String payload, String secret) {
        long timestamp = Instant.now().getEpochSecond();
        String signedPayload = timestamp + "." + payload;
        String signature = computeHmacSha256(signedPayload, secret);
        return String.format("t=%d,v1=%s", timestamp, signature);
    }

    public boolean verifySignature(String payload, String headerSignature, String secret, long toleranceSeconds) {
        try {
            String[] parts = headerSignature.split(",");
            long timestamp = -1;
            String signature = null;

            for (String part : parts) {
                String[] kv = part.split("=", 2);
                if (kv.length == 2) {
                    if ("t".equals(kv[0].trim())) {
                        timestamp = Long.parseLong(kv[1].trim());
                    } else if ("v1".equals(kv[0].trim())) {
                        signature = kv[1].trim();
                    }
                }
            }

            if (timestamp == -1 || signature == null) {
                return false;
            }

            // Anti-replay check
            long currentTimestamp = Instant.now().getEpochSecond();
            if (Math.abs(currentTimestamp - timestamp) > toleranceSeconds) {
                return false;
            }

            String expectedPayload = timestamp + "." + payload;
            String expectedSignature = computeHmacSha256(expectedPayload, secret);

            return MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }

    private String computeHmacSha256(String data, String key) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(rawHmac);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("Error computing HMAC-SHA256", e);
        }
    }
}
