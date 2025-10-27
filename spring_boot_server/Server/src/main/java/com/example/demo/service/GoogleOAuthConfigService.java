package com.example.demo.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GoogleOAuthConfigService {

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.redirect-uri:http://localhost:3000}")
    private String redirectUri;

    @Value("${google.oauth.scope:openid email profile}")
    private String scope;

    /**
     * Get Google OAuth configuration for frontend
     * @return Map containing OAuth configuration
     */
    public Map<String, String> getOAuthConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("clientId", clientId);
        config.put("redirectUri", redirectUri);
        config.put("scope", scope);
        config.put("authUrl", "https://accounts.google.com/gsi/client");
        return config;
    }

    /**
     * Get only the Client ID
     * @return Client ID string
     */
    public String getClientId() {
        return clientId;
    }

    /**
     * Get redirect URI
     * @return Redirect URI string
     */
    public String getRedirectUri() {
        return redirectUri;
    }

    /**
     * Get OAuth scope
     * @return Scope string
     */
    public String getScope() {
        return scope;
    }
}
