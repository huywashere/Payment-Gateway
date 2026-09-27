package com.gateway.infrastructure.adapter.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnExpression("'${gateway.security.vault-provider:environment}' == 'kms' && '${gateway.security.kms-adapter:placeholder}' == 'placeholder'")
public class KmsVaultServicePlaceholder implements PaymentMetadataVault {
    @Override
    public String encrypt(String plainText) {
        throw new IllegalStateException("A real KMS/HSM payment metadata vault adapter is not configured");
    }

    @Override
    public String decrypt(String cipherText) {
        throw new IllegalStateException("A real KMS/HSM payment metadata vault adapter is not configured");
    }
}
