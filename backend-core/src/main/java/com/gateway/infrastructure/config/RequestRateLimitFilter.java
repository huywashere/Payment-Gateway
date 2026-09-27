package com.gateway.infrastructure.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

@Component
public class RequestRateLimitFilter extends OncePerRequestFilter {
    private final StringRedisTemplate redis;

    @Value("${gateway.rate-limit.enabled:false}") private boolean enabled;
    @Value("${gateway.rate-limit.requests-per-minute:300}") private long defaultLimit;
    @Value("${gateway.rate-limit.checkout-requests-per-minute:120}") private long checkoutLimit;
    @Value("${gateway.rate-limit.platform-requests-per-minute:60}") private long platformLimit;
    @Value("${gateway.rate-limit.fail-open:true}") private boolean failOpen;

    public RequestRateLimitFilter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !enabled || path.startsWith("/actuator") || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs") || "OPTIONS".equals(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        long epochMinute = Instant.now().getEpochSecond() / 60;
        long limit = limit(request.getRequestURI());
        String bucket = "rate:" + category(request.getRequestURI()) + ":" + identity(request) + ":" + epochMinute;
        try {
            Long count = redis.opsForValue().increment(bucket);
            if (count != null && count == 1) redis.expire(bucket, Duration.ofSeconds(75));
            response.setHeader("X-RateLimit-Limit", Long.toString(limit));
            response.setHeader("X-RateLimit-Remaining", Long.toString(Math.max(0, limit - (count == null ? 0 : count))));
            response.setHeader("X-RateLimit-Reset", Long.toString((epochMinute + 1) * 60));
            if (count != null && count > limit) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":{\"type\":\"rate_limit_error\",\"code\":\"rate_limit_exceeded\",\"message\":\"Too many requests\"}}");
                return;
            }
        } catch (Exception e) {
            if (!failOpen) {
                response.setStatus(503);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":{\"type\":\"api_error\",\"code\":\"rate_limiter_unavailable\",\"message\":\"Request protection is temporarily unavailable\"}}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private long limit(String path) {
        if (path.startsWith("/v1/platform/")) return platformLimit;
        if (path.startsWith("/v1/checkout/")) return checkoutLimit;
        return defaultLimit;
    }

    private String category(String path) {
        if (path.startsWith("/v1/platform/")) return "platform";
        if (path.startsWith("/v1/checkout/")) return "checkout";
        return "api";
    }

    private String identity(HttpServletRequest request) {
        String credential = request.getHeader("Authorization");
        if (credential == null) credential = request.getHeader("X-Platform-Admin-Key");
        if (credential == null || credential.isBlank()) credential = request.getRemoteAddr();
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(credential.getBytes(StandardCharsets.UTF_8))).substring(0, 24);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}
