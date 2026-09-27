package com.gateway.application.service;

import com.gateway.infrastructure.adapter.persistence.entity.CustomerEntity;
import com.gateway.infrastructure.adapter.persistence.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerDataService {
    private final CustomerRepository customerRepository;
    private final AuditService auditService;

    @Transactional
    public Map<String, Object> erase(UUID merchantId, UUID customerId) {
        CustomerEntity customer = customerRepository.findByIdAndMerchantId(customerId, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        customer.setEncryptedPii(null);
        customer.setEmailDomain(null);
        customer.setPiiErasedAt(OffsetDateTime.now());
        customerRepository.save(customer);
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "customer.pii_erased",
                "customer", customerId.toString(), Map.of("financial_records_retained", true));
        return Map.of("id", customerId, "pii_erased", true,
                "pii_erased_at", customer.getPiiErasedAt().toString());
    }
}
