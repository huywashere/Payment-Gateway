package com.gateway.application.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.BankTransactionResponse;
import com.gateway.infrastructure.adapter.persistence.entity.BankAccountEntity;
import com.gateway.infrastructure.adapter.persistence.repository.BankAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class OpenBankingWebhookServiceTest {
    private final BankAccountRepository accountRepository = mock(BankAccountRepository.class);
    private final BankTransactionService bankTransactionService = mock(BankTransactionService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    private OpenBankingWebhookService service;

    @BeforeEach
    void setUp() {
        service = new OpenBankingWebhookService(accountRepository, bankTransactionService, objectMapper);
    }

    @Test
    void processSepayProcessesValidPayload() {
        UUID accountId = UUID.randomUUID();
        UUID merchantId = UUID.randomUUID();
        BankAccountEntity account = BankAccountEntity.builder()
                .id(accountId)
                .merchantId(merchantId)
                .bankCode("ACB")
                .accountNumber("1234566688")
                .status("ACTIVE")
                .build();

        when(accountRepository.findFirstByAccountNumberAndStatus("1234566688", "ACTIVE"))
                .thenReturn(Optional.of(account));

        BankTransactionResponse mockResponse = BankTransactionResponse.builder()
                .id(UUID.randomUUID())
                .bankCode("ACB")
                .amount(150_000L)
                .currency("VND")
                .paymentCode("PAY12345")
                .matchStatus("MATCHED")
                .build();

        when(bankTransactionService.ingestDirect(eq(account), any(), any())).thenReturn(mockResponse);

        String rawPayload = """
                {
                  "id": 9999,
                  "gateway": "ACB",
                  "transactionDate": "2026-10-02 20:00:00",
                  "accountNumber": "1234566688",
                  "amountIn": 150000,
                  "amountOut": 0,
                  "transactionContent": "PAY12345 chuyen khoan test",
                  "referenceNumber": "FT26109999"
                }
                """;

        BankTransactionResponse response = service.processSepay(null, null, rawPayload);

        assertThat(response).isNotNull();
        assertThat(response.getMatchStatus()).isEqualTo("MATCHED");
        assertThat(response.getPaymentCode()).isEqualTo("PAY12345");
        verify(bankTransactionService).ingestDirect(eq(account), any(), eq(rawPayload));
    }

    @Test
    void processPayOsProcessesValidPayload() {
        UUID accountId = UUID.randomUUID();
        UUID merchantId = UUID.randomUUID();
        BankAccountEntity account = BankAccountEntity.builder()
                .id(accountId)
                .merchantId(merchantId)
                .bankCode("MB")
                .accountNumber("0987654321")
                .status("ACTIVE")
                .build();

        when(accountRepository.findFirstByAccountNumberAndStatus("0987654321", "ACTIVE"))
                .thenReturn(Optional.of(account));

        BankTransactionResponse mockResponse = BankTransactionResponse.builder()
                .id(UUID.randomUUID())
                .bankCode("MB")
                .amount(200_000L)
                .currency("VND")
                .paymentCode("PAY7788")
                .matchStatus("MATCHED")
                .build();

        when(bankTransactionService.ingestDirect(eq(account), any(), any())).thenReturn(mockResponse);

        String rawPayload = """
                {
                  "code": "00",
                  "desc": "success",
                  "data": {
                    "orderCode": 8888,
                    "amount": 200000,
                    "description": "PAY7788",
                    "accountNumber": "0987654321",
                    "reference": "REF_MB_8888",
                    "transactionDateTime": "2026-10-02 20:00:00",
                    "currency": "VND"
                  }
                }
                """;

        BankTransactionResponse response = service.processPayOs(rawPayload);

        assertThat(response).isNotNull();
        assertThat(response.getMatchStatus()).isEqualTo("MATCHED");
        assertThat(response.getPaymentCode()).isEqualTo("PAY7788");
        verify(bankTransactionService).ingestDirect(eq(account), any(), eq(rawPayload));
    }
}
