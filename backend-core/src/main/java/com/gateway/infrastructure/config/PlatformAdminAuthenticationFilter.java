package com.gateway.infrastructure.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@Component
public class PlatformAdminAuthenticationFilter extends OncePerRequestFilter {
    @Value("${gateway.security.platform-admin-key:}")
    private String configuredKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (request.getRequestURI().startsWith("/v1/platform/")) {
            String supplied = request.getHeader("X-Platform-Admin-Key");
            if (supplied != null && configuredKey != null && !configuredKey.isBlank()
                    && MessageDigest.isEqual(supplied.getBytes(StandardCharsets.UTF_8),
                    configuredKey.getBytes(StandardCharsets.UTF_8))) {
                SecurityContextHolder.getContext().setAuthentication(
                        new UsernamePasswordAuthenticationToken("platform", null,
                                List.of(new SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN"))));
            }
        }
        filterChain.doFilter(request, response);
    }
}

