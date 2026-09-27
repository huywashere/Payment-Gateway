package com.gateway.application.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.application.dto.RiskProfileResponse;
import com.gateway.application.dto.UpdateRiskProfileRequest;
import com.gateway.infrastructure.adapter.persistence.entity.CustomerEntity;
import com.gateway.infrastructure.adapter.persistence.entity.PaymentIntentEntity;
import com.gateway.infrastructure.adapter.persistence.entity.RiskEvaluationEntity;
import com.gateway.infrastructure.adapter.persistence.entity.RiskProfileEntity;
import com.gateway.infrastructure.adapter.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RiskService {
    private final RiskProfileRepository profileRepository;
    private final RiskEvaluationRepository evaluationRepository;
    private final PaymentIntentRepository paymentIntentRepository;
    private final ChargeRepository chargeRepository;
    private final CustomerRepository customerRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional
    public RiskDecision evaluate(PaymentIntentEntity intent) {
        RiskProfileEntity profile = profile(intent.getMerchantId());
        if (!Boolean.TRUE.equals(profile.getEnabled())) return persist(intent, 0, List.of("risk_rules_disabled"), "ALLOW");

        int score = 0;
        List<String> reasons = new ArrayList<>();
        if (intent.getAmount() > profile.getMaxTransactionAmount()) {
            score += 100;
            reasons.add("transaction_amount_exceeds_limit");
        } else if (intent.getAmount() * 10 >= profile.getMaxTransactionAmount() * 7) {
            score += 30;
            reasons.add("high_transaction_amount");
        }

        OffsetDateTime startOfDay = OffsetDateTime.now(ZoneOffset.UTC).toLocalDate().atStartOfDay().atOffset(ZoneOffset.UTC);
        long dailyVolume = chargeRepository.sumCapturedAmountAfter(intent.getMerchantId(), startOfDay);
        if (dailyVolume + intent.getAmount() > profile.getDailyVolumeLimit()) {
            score += 80;
            reasons.add("daily_volume_limit_exceeded");
        }

        long velocity = paymentIntentRepository.countByMerchantIdAndCreatedAtAfter(
                intent.getMerchantId(), OffsetDateTime.now().minusMinutes(1));
        if (velocity > profile.getVelocityLimitPerMinute()) {
            score += 60;
            reasons.add("velocity_limit_exceeded");
        }

        if (intent.getCustomerId() != null) {
            String domain = customerRepository.findById(intent.getCustomerId())
                    .map(CustomerEntity::getEmailDomain).orElse(null);
            if (domain != null && domains(profile.getBlockedEmailDomains()).contains(domain)) {
                score += 100;
                reasons.add("blocked_email_domain");
            }
        }
        score = Math.min(score, 100);
        String decision = score >= profile.getBlockScoreThreshold() ? "BLOCK"
                : score >= profile.getReviewScoreThreshold() ? "REVIEW" : "ALLOW";
        if (reasons.isEmpty()) reasons.add("no_risk_signals");
        return persist(intent, score, reasons, decision);
    }

    @Transactional(readOnly = true)
    public RiskProfileResponse getProfile(UUID merchantId) {
        return response(profileRepository.findById(merchantId).orElseGet(() -> defaults(merchantId)));
    }

    @Transactional
    public RiskProfileResponse updateProfile(UUID merchantId, UpdateRiskProfileRequest request) {
        RiskProfileEntity profile = profile(merchantId);
        if (request.getEnabled() != null) profile.setEnabled(request.getEnabled());
        if (request.getMaxTransactionAmount() != null) profile.setMaxTransactionAmount(request.getMaxTransactionAmount());
        if (request.getDailyVolumeLimit() != null) profile.setDailyVolumeLimit(request.getDailyVolumeLimit());
        if (request.getVelocityLimitPerMinute() != null) profile.setVelocityLimitPerMinute(request.getVelocityLimitPerMinute());
        if (request.getReviewScoreThreshold() != null) profile.setReviewScoreThreshold(request.getReviewScoreThreshold());
        if (request.getBlockScoreThreshold() != null) profile.setBlockScoreThreshold(request.getBlockScoreThreshold());
        if (profile.getReviewScoreThreshold() >= profile.getBlockScoreThreshold()) {
            throw new IllegalArgumentException("reviewScoreThreshold must be lower than blockScoreThreshold");
        }
        if (request.getBlockedEmailDomains() != null) {
            profile.setBlockedEmailDomains(String.join(",", request.getBlockedEmailDomains().stream()
                    .map(value -> value.trim().toLowerCase(Locale.ROOT)).filter(value -> !value.isBlank()).sorted().toList()));
        }
        profileRepository.save(profile);
        auditService.record(merchantId, "API_KEY", merchantId.toString(), "risk_profile.updated",
                "risk_profile", merchantId.toString(), Map.of("enabled", profile.getEnabled()));
        return response(profile);
    }

    @Transactional(readOnly = true)
    public List<RiskEvaluationEntity> evaluations(UUID merchantId, int limit) {
        return evaluationRepository.findByMerchantIdOrderByCreatedAtDesc(merchantId,
                PageRequest.of(0, Math.max(1, Math.min(limit, 100))));
    }

    private RiskDecision persist(PaymentIntentEntity intent, int score, List<String> reasons, String decision) {
        try {
            RiskEvaluationEntity entity = evaluationRepository.save(RiskEvaluationEntity.builder()
                    .merchantId(intent.getMerchantId()).paymentIntentId(intent.getId()).decision(decision)
                    .score(score).reasons(objectMapper.writeValueAsString(reasons)).build());
            return new RiskDecision(entity.getDecision(), entity.getScore(), reasons);
        } catch (Exception e) {
            throw new IllegalStateException("Risk evaluation could not be persisted", e);
        }
    }

    private RiskProfileEntity profile(UUID merchantId) {
        return profileRepository.findById(merchantId).orElseGet(() -> profileRepository.save(defaults(merchantId)));
    }

    private RiskProfileEntity defaults(UUID merchantId) {
        return RiskProfileEntity.builder().merchantId(merchantId).build();
    }

    private Set<String> domains(String value) {
        if (value == null || value.isBlank()) return Set.of();
        return new HashSet<>(Arrays.asList(value.split(",")));
    }

    private RiskProfileResponse response(RiskProfileEntity entity) {
        return RiskProfileResponse.builder().merchantId(entity.getMerchantId()).enabled(entity.getEnabled())
                .maxTransactionAmount(entity.getMaxTransactionAmount()).dailyVolumeLimit(entity.getDailyVolumeLimit())
                .velocityLimitPerMinute(entity.getVelocityLimitPerMinute())
                .reviewScoreThreshold(entity.getReviewScoreThreshold()).blockScoreThreshold(entity.getBlockScoreThreshold())
                .blockedEmailDomains(new TreeSet<>(domains(entity.getBlockedEmailDomains())))
                .updatedAt(entity.getUpdatedAt()).build();
    }

    public record RiskDecision(String decision, int score, List<String> reasons) {}
}
