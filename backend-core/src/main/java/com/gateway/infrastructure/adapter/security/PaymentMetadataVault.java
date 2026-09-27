package com.gateway.infrastructure.adapter.security;

public interface PaymentMetadataVault {
    String encrypt(String plainText);
    String decrypt(String cipherText);
}
