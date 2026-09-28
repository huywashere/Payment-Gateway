package com.gateway.application.service;

import com.gateway.application.dto.AcquirerOperationRequest;
import com.gateway.application.dto.AcquirerOperationResponse;
import com.gateway.infrastructure.adapter.persistence.entity.AcquirerOperationEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.repository.AcquirerOperationRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import com.gateway.infrastructure.adapter.processor.AcquirerProcessor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AcquirerLifecycleService {
    private final AcquirerOperationRepository repository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final AcquirerProcessor processor;
    private final AuditService auditService;

    @Transactional
    public AcquirerOperationResponse execute(UUID merchantId, String idempotencyKey,
                                             AcquirerOperationRequest request) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new IllegalArgumentException("Idempotency-Key is required");
        }
        var existing = repository.findByMerchantIdAndIdempotencyKey(merchantId, idempotencyKey);
        if (existing.isPresent()) {
            assertSameRequest(existing.get(), request);
            return response(existing.get());
        }

        AcquirerOperationEntity parent = null;
        UUID paymentIntentId = request.getPaymentIntentId();
        if (request.getParentOperationId() != null) {
            parent = repository.findOwnedForUpdate(request.getParentOperationId(), merchantId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent acquirer operation not found"));
            paymentIntentId = parent.getPaymentIntentId();
        }
        validatePaymentIntent(merchantId, paymentIntentId);
        validateTransition(request, parent);

        var result = processor.execute(new AcquirerProcessor.AcquirerCommand(merchantId, paymentIntentId,
                request.getOperationType(), request.getAmount(), request.getCurrency().toUpperCase(),
                request.getScenario(), request.isRequestThreeDs()));
        AcquirerOperationEntity operation = repository.save(AcquirerOperationEntity.builder()
                .merchantId(merchantId).paymentIntentId(paymentIntentId)
                .parentOperationId(request.getParentOperationId()).operationType(request.getOperationType())
                .idempotencyKey(idempotencyKey).processorCode(result.processorCode())
                .processorReference(result.processorReference()).amount(request.getAmount())
                .currency(request.getCurrency().toUpperCase()).status(result.status())
                .threeDsVersion(result.threeDsVersion()).actionUrl(result.actionUrl())
                .failureCode(result.failureCode()).build());
        auditService.record(merchantId, "API_KEY", merchantId.toString(),
                "acquirer." + request.getOperationType().toLowerCase(), "acquirer_operation",
                operation.getId().toString(), java.util.Map.of("status", operation.getStatus()));
        return response(operation);
    }

    @Transactional
    public AcquirerOperationResponse completeThreeDs(UUID merchantId, UUID id, boolean successful) {
        AcquirerOperationEntity operation = repository.findByIdAndMerchantId(id, merchantId)
                .orElseThrow(() -> new IllegalArgumentException("Acquirer operation not found"));
        if (!"AUTHORIZE".equals(operation.getOperationType()) || !"REQUIRES_ACTION".equals(operation.getStatus())) {
            throw new IllegalArgumentException("Operation is not awaiting 3DS authentication");
        }
        operation.setStatus(successful ? "AUTHORIZED" : "FAILED");
        operation.setFailureCode(successful ? null : "three_ds_authentication_failed");
        operation.setActionUrl(null);
        return response(repository.save(operation));
    }

    @Transactional(readOnly = true)
    public List<AcquirerOperationResponse> list(UUID merchantId, UUID paymentIntentId) {
        validatePaymentIntent(merchantId, paymentIntentId);
        return repository.findByPaymentIntentIdOrderByCreatedAtAsc(paymentIntentId).stream()
                .filter(value -> value.getMerchantId().equals(merchantId)).map(this::response).toList();
    }

    private void validatePaymentIntent(UUID merchantId, UUID paymentIntentId) {
        if (paymentIntentId == null) throw new IllegalArgumentException("paymentIntentId is required");
        PaymentIntentEntity intent = paymentIntentRepository.findById(paymentIntentId)
                .filter(value -> value.getMerchantId().equals(merchantId))
                .orElseThrow(() -> new IllegalArgumentException("Payment intent not found"));
    }

    private void validateTransition(AcquirerOperationRequest request, AcquirerOperationEntity parent) {
        String type = request.getOperationType();
        if ("AUTHORIZE".equals(type)) {
            if (parent != null) throw new IllegalArgumentException("AUTHORIZE cannot have a parent operation");
            return;
        }
        if (parent == null) throw new IllegalArgumentException(type + " requires a parent operation");
        if (!request.getCurrency().equalsIgnoreCase(parent.getCurrency())) {
            throw new IllegalArgumentException("Operation currency must match its parent");
        }
        if (("CAPTURE".equals(type) || "VOID".equals(type))
                && !("AUTHORIZE".equals(parent.getOperationType()) && "AUTHORIZED".equals(parent.getStatus()))) {
            throw new IllegalArgumentException(type + " requires an authorized parent");
        }
        if (("REFUND".equals(type) || "DISPUTE".equals(type))
                && !("CAPTURE".equals(parent.getOperationType()) && "CAPTURED".equals(parent.getStatus()))) {
            throw new IllegalArgumentException(type + " requires a captured parent");
        }
        if ("VOID".equals(type) && !repository.findByParentOperationIdOrderByCreatedAtAsc(parent.getId()).isEmpty()) {
            throw new IllegalArgumentException("Authorization with child operations cannot be voided");
        }
        if ("CAPTURE".equals(type) || "REFUND".equals(type)) {
            long consumed = repository.findByParentOperationIdOrderByCreatedAtAsc(parent.getId()).stream()
                    .filter(value -> value.getOperationType().equals(type))
                    .filter(value -> !"FAILED".equals(value.getStatus())).mapToLong(AcquirerOperationEntity::getAmount).sum();
            if (consumed + request.getAmount() > parent.getAmount()) {
                throw new IllegalArgumentException(type + " amount exceeds remaining parent amount");
            }
        } else if (request.getAmount() > parent.getAmount()) {
            throw new IllegalArgumentException(type + " amount exceeds parent amount");
        }
    }

    private void assertSameRequest(AcquirerOperationEntity existing, AcquirerOperationRequest request) {
        if (!existing.getOperationType().equals(request.getOperationType())
                || !Objects.equals(existing.getParentOperationId(), request.getParentOperationId())
                || !existing.getAmount().equals(request.getAmount())
                || !existing.getCurrency().equalsIgnoreCase(request.getCurrency())) {
            throw new IllegalStateException("Idempotency-Key was already used with a different request");
        }
    }

    private AcquirerOperationResponse response(AcquirerOperationEntity value) {
        return AcquirerOperationResponse.builder().id(value.getId()).object("acquirer_operation")
                .paymentIntentId(value.getPaymentIntentId()).parentOperationId(value.getParentOperationId())
                .operationType(value.getOperationType()).processorCode(value.getProcessorCode())
                .processorReference(value.getProcessorReference()).amount(value.getAmount())
                .currency(value.getCurrency()).status(value.getStatus()).threeDsVersion(value.getThreeDsVersion())
                .actionUrl(value.getActionUrl()).failureCode(value.getFailureCode())
                .createdAt(value.getCreatedAt()).build();
    }
}
