package com.gateway.infrastructure.adapter.processor;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = "gateway.processor.mode=bank-sandbox")
class BankSandboxProcessorContextTest {
    @Autowired
    private BankProcessor processor;

    @Test
    void startsBankSandboxProcessorFromSpringConfiguration() {
        assertThat(processor).isInstanceOf(BankSandboxProcessor.class);
        assertThat(processor.availableBanks()).hasSize(4);
    }
}
