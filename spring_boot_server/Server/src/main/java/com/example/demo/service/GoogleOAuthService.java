package com.example.demo.service;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleOAuthService {

    private final GoogleIdTokenVerifier verifier;
    private final String clientId;

    public GoogleOAuthService(@Value("${google.oauth.client-id}") String clientId) {
        this.clientId = clientId;
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public String getClientId() {
        return clientId;
    }

    public GoogleIdToken verifyToken(String idTokenString) {
        try {
            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                return idToken;
            }
        } catch (GeneralSecurityException | IOException e) {
            System.err.println("Error verifying Google ID token: " + e.getMessage());
        }
        return null;
    }

    public GoogleUserInfo extractUserInfo(GoogleIdToken idToken) {
        if (idToken == null) {
            return null;
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        
        return GoogleUserInfo.builder()
                .googleId(payload.getSubject())
                .email(payload.getEmail())
                .emailVerified(payload.getEmailVerified())
                .name((String) payload.get("name"))
                .pictureUrl((String) payload.get("picture"))
                .givenName((String) payload.get("given_name"))
                .familyName((String) payload.get("family_name"))
                .locale((String) payload.get("locale"))
                .build();
    }

    public GoogleUserInfo verifyAndExtractUserInfo(String idTokenString) {
        GoogleIdToken idToken = verifyToken(idTokenString);
        return extractUserInfo(idToken);
    }

    public static class GoogleUserInfo {
        private String googleId;
        private String email;
        private Boolean emailVerified;
        private String name;
        private String pictureUrl;
        private String givenName;
        private String familyName;
        private String locale;

        // Builder pattern
        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final GoogleUserInfo userInfo = new GoogleUserInfo();

            public Builder googleId(String googleId) {
                userInfo.googleId = googleId;
                return this;
            }

            public Builder email(String email) {
                userInfo.email = email;
                return this;
            }

            public Builder emailVerified(Boolean emailVerified) {
                userInfo.emailVerified = emailVerified;
                return this;
            }

            public Builder name(String name) {
                userInfo.name = name;
                return this;
            }

            public Builder pictureUrl(String pictureUrl) {
                userInfo.pictureUrl = pictureUrl;
                return this;
            }

            public Builder givenName(String givenName) {
                userInfo.givenName = givenName;
                return this;
            }

            public Builder familyName(String familyName) {
                userInfo.familyName = familyName;
                return this;
            }

            public Builder locale(String locale) {
                userInfo.locale = locale;
                return this;
            }

            public GoogleUserInfo build() {
                return userInfo;
            }
        }

        // Getters
        public String getGoogleId() { 
            return googleId; 
        }

        public String getEmail() { 
            return email; 
        }

        public Boolean getEmailVerified() { 
            return emailVerified; 
        }

        public String getName() { 
            return name; 
        }

        public String getPictureUrl() { 
            return pictureUrl; 
        }

        public String getGivenName() { 
            return givenName; 
        }

        public String getFamilyName() { 
            return familyName; 
        }

        public String getLocale() { 
            return locale; 
        }
    }
}
