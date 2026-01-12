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

    public Map<String, String> getOAuthConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("clientId", clientId);
        config.put("redirectUri", redirectUri);
        config.put("scope", scope);
        config.put("authUrl", "https://accounts.google.com/gsi/client");
        return config;
    }

    public String getClientId() {
        return clientId;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public String getScope() {
        return scope;
    }
}
