package com.gateway.infrastructure.config;

import com.gateway.infrastructure.adapter.persistence.repository.MerchantRepository;
import com.gateway.infrastructure.adapter.processor.BankProcessor;
import com.gateway.infrastructure.adapter.processor.LiveProcessorPlaceholder;
import com.gateway.infrastructure.adapter.processor.LivePayoutProcessorPlaceholder;
import com.gateway.infrastructure.adapter.processor.PayoutProcessor;
import com.gateway.infrastructure.adapter.security.KmsVaultServicePlaceholder;
import com.gateway.infrastructure.adapter.security.PaymentMetadataVault;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.Arrays;
import java.util.Locale;
import java.util.UUID;

@Component
@Profile("production")
@RequiredArgsConstructor
public class ProductionReadinessValidator implements ApplicationRunner {
    private static final UUID DEMO_MERCHANT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final Environment environment;
    private final BankProcessor bankProcessor;
    private final PayoutProcessor payoutProcessor;
    private final PaymentMetadataVault paymentMetadataVault;
    private final MerchantRepository merchantRepository;

    @Override
    public void run(ApplicationArguments args) {
        requireEquals("gateway.mode", "live");
        requireEquals("gateway.processor.mode", "live");
        requireEquals("gateway.security.platform-auth-mode", "oidc");
        requireEquals("gateway.security.vault-provider", "kms");
        requireTrue("gateway.production.external-controls-attested");
        requireTrue("gateway.webhooks.delivery-enabled");
        requireTrue("gateway.rate-limit.enabled");
        requireFalse("gateway.rate-limit.fail-open");
        requireTrue("spring.data.redis.ssl.enabled");
        requireTrue("spring.rabbitmq.ssl.enabled");

        if (bankProcessor instanceof LiveProcessorPlaceholder) {
            fail("A contracted live BankProcessor adapter must replace LiveProcessorPlaceholder");
        }
        if (payoutProcessor instanceof LivePayoutProcessorPlaceholder) {
            fail("A contracted live PayoutProcessor adapter must replace LivePayoutProcessorPlaceholder");
        }
        if (paymentMetadataVault instanceof KmsVaultServicePlaceholder) {
            fail("A real KMS/HSM PaymentMetadataVault adapter must replace KmsVaultServicePlaceholder");
        }

        validateOrigins();
        validateDatabaseTransport();
        String platformIssuer = required("spring.security.oauth2.resourceserver.jwt.issuer-uri");
        if (!platformIssuer.startsWith("https://")) fail("Platform OIDC issuer must use HTTPS");

        merchantRepository.findById(DEMO_MERCHANT_ID)
                .filter(merchant -> "ACTIVE".equalsIgnoreCase(merchant.getStatus()))
                .ifPresent(merchant -> fail("The seeded demo merchant must be removed or suspended before production"));
    }

    private void validateOrigins() {
        String[] origins = environment.getProperty("gateway.security.allowed-origins", String[].class, new String[0]);
        if (origins.length == 0) fail("At least one HTTPS allowed origin is required");
        Arrays.stream(origins).forEach(origin -> {
            URI uri;
            try {
                uri = URI.create(origin.trim());
            } catch (IllegalArgumentException exception) {
                fail("Invalid allowed origin: " + origin);
                return;
            }
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                    || "localhost".equalsIgnoreCase(uri.getHost()) || uri.getHost().startsWith("127.")) {
                fail("Production allowed origins must be non-local HTTPS origins: " + origin);
            }
        });
    }

    private void validateDatabaseTransport() {
        String url = required("spring.datasource.url").toLowerCase(Locale.ROOT);
        if (!url.contains("sslmode=require") && !url.contains("sslmode=verify-full")) {
            fail("Production PostgreSQL URL must enforce TLS with sslmode=require or sslmode=verify-full");
        }
    }

    private void requireEquals(String property, String expected) {
        if (!expected.equalsIgnoreCase(required(property))) fail(property + " must be " + expected);
    }

    private void requireTrue(String property) {
        if (!Boolean.parseBoolean(required(property))) fail(property + " must be true");
    }

    private void requireFalse(String property) {
        if (Boolean.parseBoolean(required(property))) fail(property + " must be false");
    }

    private String required(String property) {
        String value = environment.getProperty(property);
        if (value == null || value.isBlank()) fail(property + " is required");
        return value.trim();
    }

    private void fail(String message) {
        throw new IllegalStateException("Production readiness check failed: " + message);
    }
}
