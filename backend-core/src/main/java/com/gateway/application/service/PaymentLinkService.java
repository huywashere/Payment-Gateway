package com.gateway.application.service;

import com.gateway.application.dto.*;
import com.gateway.infrastructure.adapter.persistence.entity.BankAccountEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentLinkEntity;
import com.gateway.infrastructure.adapter.persistence.repository.BankAccountRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentIntentRepository;
import com.gateway.infrastructure.adapter.persistence.repository.PaymentLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import com.gateway.application.event.PaymentLinkStatusChanged;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PaymentLinkService {
    private final PaymentLinkRepository linkRepository;
    private final PaymentIntentRepository intentRepository;
    private final BankAccountRepository bankAccountRepository;
    private final BankAccountService bankAccountService;
    private final PaymentIntentService paymentIntentService;
    private final VietQrPayloadService vietQrPayloadService;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;
    private final SecureRandom random = new SecureRandom();

    @Value("${gateway.public-base-url:http://localhost:3000}") private String publicBaseUrl;

    @Transactional
    public PaymentLinkResponse create(UUID merchantId, String idempotencyKey, CreatePaymentLinkRequest request) {
        BankAccountEntity account = request.getBankAccountId() == null
                ? bankAccountService.defaultAccount(merchantId)
                : bankAccountService.owned(merchantId, request.getBankAccountId());
        if (!"ACTIVE".equals(account.getStatus())) throw new IllegalStateException("Bank account is not active");
        String prefix = request.getPaymentCodePrefix().toUpperCase(Locale.ROOT);
        String code = paymentCode(prefix, merchantId, requireIdempotency(idempotencyKey));
        PaymentIntentResponse intent = paymentIntentService.createPaymentIntent(merchantId,
                "payment-link:" + idempotencyKey, CreatePaymentIntentRequest.builder()
                        .amount(request.getAmount()).currency(request.getCurrency().toUpperCase(Locale.ROOT))
                        .description(request.getDescription())
                        .metadata(Map.of("payment_code", code, "source", "payment_link")).build());
        PaymentLinkEntity existing = linkRepository.findByPaymentIntentId(intent.getId()).orElse(null);
        if (existing != null) {
            return response(existing, intentRepository.findById(intent.getId()).orElseThrow(),
                    bankAccountRepository.findById(existing.getBankAccountId()).orElseThrow());
        }
        PaymentLinkEntity link = linkRepository.save(PaymentLinkEntity.builder()
                .merchantId(merchantId).paymentIntentId(intent.getId()).bankAccountId(account.getId())
                .slug("plink_" + randomCode(24).toLowerCase(Locale.ROOT)).paymentCode(code).status("OPEN")
                .expiresAt(OffsetDateTime.now().plusMinutes(request.getExpiresInMinutes())).build());
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "payment_link.created",
                "payment_link", link.getId().toString(), Map.of("payment_code", code));
        return response(link, intentRepository.findById(intent.getId()).orElseThrow(), account);
    }

    @Transactional
    public PaymentLinkResponse publicStatus(String slug) {
        PaymentLinkEntity link = linkRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Payment link not found"));
        expireIfNeeded(link);
        return response(link, intentRepository.findById(link.getPaymentIntentId()).orElseThrow(),
                bankAccountRepository.findById(link.getBankAccountId()).orElseThrow());
    }

    @Transactional(readOnly = true)
    public List<PaymentLinkResponse> list(UUID merchantId) {
        return linkRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream().map(link -> response(link,
                intentRepository.findById(link.getPaymentIntentId()).orElseThrow(),
                bankAccountRepository.findById(link.getBankAccountId()).orElseThrow())).toList();
    }

    @Transactional(readOnly = true)
    public PaymentLinkResponse get(UUID merchantId, UUID id) {
        PaymentLinkEntity link = linkRepository.findById(id)
                .filter(value -> value.getMerchantId().equals(merchantId))
                .orElseThrow(() -> new IllegalArgumentException("Payment link not found"));
        return response(link, intentRepository.findById(link.getPaymentIntentId()).orElseThrow(),
                bankAccountRepository.findById(link.getBankAccountId()).orElseThrow());
    }

    @Transactional
    public String qrSvg(String slug, int size) {
        PaymentLinkResponse link = publicStatus(slug);
        return vietQrPayloadService.svg(link.getQrPayload(), size);
    }

    private void expireIfNeeded(PaymentLinkEntity link) {
        if ("OPEN".equals(link.getStatus()) && link.getExpiresAt().isBefore(OffsetDateTime.now())) {
            link.setStatus("EXPIRED");
            linkRepository.save(link);
            eventPublisher.publishEvent(new PaymentLinkStatusChanged(link.getSlug(), link.getStatus(), null));
        }
    }

    private PaymentLinkResponse response(PaymentLinkEntity link, PaymentIntentEntity intent, BankAccountEntity account) {
        String qrPayload = vietQrPayloadService.generate(account.getBankBin(), account.getAccountNumber(),
                intent.getAmount(), link.getPaymentCode());
        String base = publicBaseUrl.replaceAll("/$", "");
        return PaymentLinkResponse.builder().id(link.getId()).object("payment_link").slug(link.getSlug())
                .paymentCode(link.getPaymentCode()).amount(intent.getAmount()).currency(intent.getCurrency())
                .description(intent.getDescription()).status(link.getStatus()).bankCode(account.getBankCode())
                .bankName(account.getBankCode()).accountNumber(account.getAccountNumber()).accountName(account.getAccountName())
                .qrPayload(qrPayload).paymentUrl(base + "/pay/" + link.getSlug())
                .qrImageUrl("/v1/payment_links/public/" + link.getSlug() + "/qr.svg")
                .expiresAt(link.getExpiresAt()).paidAt(link.getPaidAt()).build();
    }

    private String randomCode(int length) {
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder result = new StringBuilder(length);
        for (int i = 0; i < length; i++) result.append(alphabet.charAt(random.nextInt(alphabet.length())));
        return result.toString();
    }

    private String requireIdempotency(String value) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Idempotency-Key is required");
        return value;
    }

    private String paymentCode(String prefix, UUID merchantId, String idempotencyKey) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest((merchantId + ":" + idempotencyKey).getBytes(StandardCharsets.UTF_8));
            return prefix + HexFormat.of().formatHex(digest, 0, 7).toUpperCase(Locale.ROOT);
        } catch (Exception exception) {
            throw new IllegalStateException("SHA-256 unavailable", exception);
        }
    }
}
