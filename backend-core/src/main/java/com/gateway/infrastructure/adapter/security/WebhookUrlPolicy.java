package com.gateway.infrastructure.adapter.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.URI;
import java.util.Set;

@Component
public class WebhookUrlPolicy {
    @Value("${gateway.webhooks.allow-private-endpoints:false}") private boolean allowPrivateEndpoints;
    @Value("${gateway.webhooks.require-https:false}") private boolean requireHttps;

    public URI validate(String value) {
        try {
            URI uri = URI.create(value);
            if (!Set.of("http", "https").contains(uri.getScheme()) || uri.getHost() == null
                    || uri.getUserInfo() != null || uri.getFragment() != null) {
                throw new IllegalArgumentException("Webhook URL must be an absolute HTTP(S) URL without credentials or fragments");
            }
            if (requireHttps && !"https".equals(uri.getScheme())) {
                throw new IllegalArgumentException("Production webhook endpoints must use HTTPS");
            }
            if (!allowPrivateEndpoints) {
                for (InetAddress address : InetAddress.getAllByName(uri.getHost())) {
                    if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
                            || address.isSiteLocalAddress() || address.isMulticastAddress()) {
                        throw new IllegalArgumentException("Private network webhook endpoints are disabled");
                    }
                }
            }
            return uri;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Webhook URL could not be resolved", e);
        }
    }
}
