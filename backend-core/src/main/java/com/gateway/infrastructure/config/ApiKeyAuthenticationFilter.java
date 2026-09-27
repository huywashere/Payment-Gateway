package com.gateway.infrastructure.config;

import com.gateway.infrastructure.adapter.persistence.entity.ApiKeyEntity;
import com.gateway.infrastructure.adapter.persistence.repository.ApiKeyRepository;
import com.gateway.infrastructure.adapter.persistence.repository.MerchantRepository;
import com.gateway.infrastructure.adapter.security.ApiKeyHasher;
import com.gateway.application.service.ApiKeyService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private final ApiKeyRepository apiKeyRepository;
    private final ApiKeyHasher apiKeyHasher;
    private final MerchantRepository merchantRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();

        // Bypass swagger, actuator, and public endpoints
        if (path.startsWith("/swagger-ui") ||
            path.startsWith("/v3/api-docs") ||
            path.startsWith("/actuator") ||
            path.startsWith("/api/public") ||
            path.startsWith("/v1/checkout")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String rawApiKey = authHeader.substring(7).trim();
        String secretHash = apiKeyHasher.hashApiKey(rawApiKey);

        Optional<ApiKeyEntity> apiKeyOpt = apiKeyRepository.findBySecretHashAndIsActiveTrue(secretHash);
        if (apiKeyOpt.isPresent()) {
            ApiKeyEntity key = apiKeyOpt.get();
            boolean expired = key.getExpiresAt() != null && key.getExpiresAt().isBefore(OffsetDateTime.now());
            boolean merchantActive = merchantRepository.findById(key.getMerchantId())
                    .map(merchant -> "ACTIVE".equals(merchant.getStatus())).orElse(false);
            if (expired || !merchantActive) {
                filterChain.doFilter(request, response);
                return;
            }
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + key.getKeyType()));
            ApiKeyService.parseScopes(key.getScopes()).forEach(scope ->
                    authorities.add(new SimpleGrantedAuthority("SCOPE_" + scope)));
            // Store Merchant ID as principal
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    key.getMerchantId(),
                    null,
                    authorities
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            key.setLastUsedAt(OffsetDateTime.now());
            apiKeyRepository.save(key);
        }

        filterChain.doFilter(request, response);
    }
}
