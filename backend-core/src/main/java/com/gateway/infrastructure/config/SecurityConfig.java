package com.gateway.infrastructure.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;

@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ApiKeyAuthenticationFilter apiKeyAuthenticationFilter;
    private final PlatformAdminAuthenticationFilter platformAdminAuthenticationFilter;
    private final RequestRateLimitFilter requestRateLimitFilter;

    @Value("${gateway.security.allowed-origins}")
    private List<String> allowedOrigins;

    @Value("${gateway.security.platform-auth-mode:key}")
    private String platformAuthMode;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'none'; frame-ancestors 'none'"))
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .permissionsPolicyHeader(permissions -> permissions
                                .policy("camera=(), microphone=(), geolocation=(), payment=()")))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/actuator/**",
                                "/v1/checkout/**",
                                "/v1/payment_links/public/**",
                                "/api/public/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/v1/sandbox/bank/callbacks").permitAll()
                        .requestMatchers(HttpMethod.POST, "/v1/sandbox/bank/*/callbacks").permitAll()
                        .requestMatchers(HttpMethod.GET, "/v1/sandbox/bank/providers").permitAll()
                        .requestMatchers(HttpMethod.POST, "/v1/bank_transactions/inbox/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/v1/open_banking/webhook/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/v1/platform/**").hasRole("PLATFORM_ADMIN")
                        .requestMatchers("/v1/payment_methods/**").hasAnyRole("SECRET", "PUBLISHABLE")
                        .anyRequest().hasRole("SECRET")
                )
                .addFilterBefore(platformAdminAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(apiKeyAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(requestRateLimitFilter, PlatformAdminAuthenticationFilter.class);

        if ("oidc".equalsIgnoreCase(platformAuthMode)) {
            http.oauth2ResourceServer(oauth2 -> oauth2
                    .bearerTokenResolver(request -> request.getRequestURI().startsWith("/v1/platform/")
                            ? resolveBearer(request.getHeader("Authorization")) : null)
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(platformJwtConverter())));
        }

        return http.build();
    }

    private JwtAuthenticationConverter platformJwtConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            Collection<GrantedAuthority> authorities = new ArrayList<>();
            List<String> roles = new ArrayList<>();
            Object direct = jwt.getClaims().get("roles");
            if (direct instanceof Collection<?> collection) {
                for (Object role : collection) roles.add(String.valueOf(role));
            }
            Object realm = jwt.getClaims().get("realm_access");
            if (realm instanceof Map<?, ?> map && map.get("roles") instanceof Collection<?> collection) {
                for (Object role : collection) roles.add(String.valueOf(role));
            }
            roles.stream().map(role -> role.toUpperCase(Locale.ROOT))
                    .filter(role -> role.equals("PLATFORM_ADMIN") || role.equals("PAYMENTS_PLATFORM_ADMIN"))
                    .map(role -> new SimpleGrantedAuthority("ROLE_PLATFORM_ADMIN"))
                    .forEach(authorities::add);
            return authorities;
        });
        return converter;
    }

    private String resolveBearer(String authorization) {
        return authorization != null && authorization.startsWith("Bearer ")
                ? authorization.substring(7).trim() : null;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID",
                "X-Platform-Admin-Key", "X-Bank-Signature"));
        config.setExposedHeaders(List.of("X-Request-ID"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
