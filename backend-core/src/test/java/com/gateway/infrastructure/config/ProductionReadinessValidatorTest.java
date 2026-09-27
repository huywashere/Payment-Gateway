package com.gateway.infrastructure.config;

import com.gateway.infrastructure.adapter.persistence.repository.MerchantRepository;
import com.gateway.infrastructure.adapter.processor.LivePayoutProcessorPlaceholder;
import com.gateway.infrastructure.adapter.processor.LiveProcessorPlaceholder;
import com.gateway.infrastructure.adapter.security.KmsVaultServicePlaceholder;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class ProductionReadinessValidatorTest {
    @Test
    void refusesProductionWhenLiveAdaptersAreStillPlaceholders() {
        MockEnvironment environment = new MockEnvironment()
                .withProperty("gateway.mode", "live")
                .withProperty("gateway.processor.mode", "live")
                .withProperty("gateway.security.platform-auth-mode", "oidc")
                .withProperty("gateway.security.vault-provider", "kms")
                .withProperty("gateway.production.external-controls-attested", "true")
                .withProperty("gateway.webhooks.delivery-enabled", "true")
                .withProperty("gateway.rate-limit.enabled", "true")
                .withProperty("gateway.rate-limit.fail-open", "false")
                .withProperty("spring.data.redis.ssl.enabled", "true")
                .withProperty("spring.rabbitmq.ssl.enabled", "true");
        ProductionReadinessValidator validator = new ProductionReadinessValidator(
                environment, new LiveProcessorPlaceholder(), new LivePayoutProcessorPlaceholder(),
                new KmsVaultServicePlaceholder(), mock(MerchantRepository.class));

        assertThatThrownBy(() -> validator.run(new DefaultApplicationArguments()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("LiveProcessorPlaceholder");
    }
}
