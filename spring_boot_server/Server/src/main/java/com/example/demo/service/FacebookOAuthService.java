package com.example.demo.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.example.demo.model.User;

@Service
public class FacebookOAuthService {

    @Value("${facebook.oauth.app-id}")
    private String appId;

    @Value("${facebook.oauth.app-secret}")
    private String appSecret;

    @Value("${facebook.oauth.redirect-uri}")
    private String redirectUri;

    @Value("${facebook.oauth.scope}")
    private String scope;

    /**
     * Get Facebook OAuth configuration for frontend
     * @return Map containing OAuth configuration
     */
    public Map<String, String> getOAuthConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("appId", appId);
        config.put("redirectUri", redirectUri);
        config.put("scope", scope);
        config.put("version", "v18.0"); // Facebook API version
        return config;
    }

    /**
     * Get only the App ID
     * @return App ID string
     */
    public String getAppId() {
        return appId;
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

    /**
     * Verify Facebook access token and get user info
     * @param accessToken Facebook access token
     * @return Map containing user info
     */
    public Map<String, String> verifyTokenAndGetUserInfo(String accessToken) {
        Map<String, String> userInfo = new HashMap<>();
        
        try {
            // Verify token is valid
            String verifyUrl = String.format(
                "https://graph.facebook.com/me?access_token=%s&fields=id,name,email,picture",
                accessToken
            );
            
            // This will be handled by frontend's fetch or backend HTTP client
            // For now, return basic structure
            userInfo.put("accessToken", accessToken);
            
        } catch (Exception e) {
            System.err.println("Error verifying Facebook token: " + e.getMessage());
        }
        
        return userInfo;
    }

    /**
     * Extract user data from Facebook response
     * @param fbData Facebook data from frontend
     * @return User object
     */
    public User extractUserFromFacebookData(Map<String, String> fbData) {
        String facebookId = fbData.get("id");
        String fullName = fbData.get("name");
        String email = fbData.get("email");
        String profilePicture = fbData.get("picture");
        
        User user = new User(facebookId, fullName, email, "facebook");
        
        if (profilePicture != null && !profilePicture.isEmpty()) {
            user.setAvatar(profilePicture);
        }
        
        return user;
    }
}
