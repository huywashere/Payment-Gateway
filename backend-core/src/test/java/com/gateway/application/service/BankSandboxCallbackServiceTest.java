package com.gateway.application.service;

import com.gateway.application.dto.BankSandboxCallbackRequest;
import com.gateway.domain.model.payment.PaymentIntentStatus;
import com.gateway.infrastructure.adapter.persistence.entity.ChargeEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.repository.ChargeRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import com.gateway.infrastructure.adapter.security.HmacSigner;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BankSandboxCallbackServiceTest {
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final ChargeRepository charges = mock(ChargeRepository.class);
    private final PaymentIntentRepository intents = mock(PaymentIntentRepository.class);
    private final LedgerService ledger = mock(LedgerService.class);
    private final OutboxService outbox = mock(OutboxService.class);
    private final HmacSigner signer = new HmacSigner();
    private final BankSandboxCallbackService service =
            new BankSandboxCallbackService(signer, jdbc, charges, intents, ledger, outbox);

    @Test
    void signedSuccessCallbackCapturesPendingChargeExactlyOnce() {
        ReflectionTestUtils.setField(service, "callbackSecret", "callback-secret");
        UUID merchantId = UUID.randomUUID();
        UUID intentId = UUID.randomUUID();
        ChargeEntity charge = ChargeEntity.builder().id(UUID.randomUUID()).merchantId(merchantId)
                .paymentIntentId(intentId).processorTxId("sbank_txn_123").amount(125_000L)
                .feeAmount(3_875L).currency("VND").status("PENDING").build();
        PaymentIntentEntity intent = PaymentIntentEntity.builder().id(intentId).merchantId(merchantId)
                .amount(125_000L).currency("VND").status(PaymentIntentStatus.REQUIRES_ACTION).build();
        when(jdbc.update(startsWith("INSERT INTO processor_callbacks"), any(), any(), any())).thenReturn(1);
        when(charges.findByProcessorTxIdForUpdate("sbank_txn_123")).thenReturn(Optional.of(charge));
        when(intents.findById(intentId)).thenReturn(Optional.of(intent));

        BankSandboxCallbackRequest request = new BankSandboxCallbackRequest();
        request.setEventId("evt_123");
        request.setProcessorTransactionId("sbank_txn_123");
        request.setStatus("SUCCEEDED");
        request.setAmount(125_000L);
        request.setCurrency("VND");
        String payload = "{\"eventId\":\"evt_123\"}";

        var result = service.accept(request, payload, signer.generateWebhookSignature(payload, "callback-secret"));

        assertThat(result.get("outcome")).isEqualTo("processed");
        assertThat(charge.getStatus()).isEqualTo("SUCCEEDED");
        assertThat(intent.getStatus()).isEqualTo(PaymentIntentStatus.SUCCEEDED);
        verify(ledger).recordPaymentSucceeded(charge);
        verify(outbox).enqueue(eq(merchantId), eq("PAYMENT_INTENT"), eq(intentId),
                eq("payment_intent.succeeded"), anyMap());
    }
}
