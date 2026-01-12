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

    public Map<String, String> getOAuthConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("appId", appId);
        config.put("redirectUri", redirectUri);
        config.put("scope", scope);
        config.put("version", "v18.0"); 
        return config;
    }

    public String getAppId() {
        return appId;
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public String getScope() {
        return scope;
    }

    public Map<String, String> verifyTokenAndGetUserInfo(String accessToken) {
        Map<String, String> userInfo = new HashMap<>();
        
        try {
            String verifyUrl = String.format(
        "https://graph.facebook.com/me?access_token=%s&fields=id,name,email,picture",
                accessToken
            );

            userInfo.put("accessToken", accessToken);
            
        } catch (Exception e) {
            System.err.println("Error verifying Facebook token: " + e.getMessage());
        }
        
        return userInfo;
    }

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
