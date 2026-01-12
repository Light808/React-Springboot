package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.PasswordResetToken;
import com.example.demo.model.User;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class PasswordResetController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // Request password reset
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, Object>> forgotPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            
            if (email == null || email.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }

            // Find user by email
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (!userOpt.isPresent()) {
                response.put("success", true);
                response.put("message", "If an account with that email exists, a password reset link has been sent.");
                return ResponseEntity.ok(response);
            }

            User user = userOpt.get();

            // Delete any existing tokens for this user
            tokenRepository.deleteByUserId(user.getId());

            // Generate reset token
            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = new PasswordResetToken(token, user.getId());
            tokenRepository.save(resetToken);

            // Create reset URL
            String resetUrl = frontendUrl + "/reset-password?token=" + token;

            // Send email
            emailService.sendPasswordResetEmail(user.getEmail(), token, resetUrl);

            response.put("success", true);
            response.put("message", "Password reset link has been sent to your email.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Reset password with token
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            if (token == null || token.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Token is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (newPassword == null || newPassword.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "New password is required");
                return ResponseEntity.badRequest().body(response);
            }

            if (newPassword.length() < 6) {
                response.put("success", false);
                response.put("message", "Password must be at least 6 characters long");
                return ResponseEntity.badRequest().body(response);
            }

            // Find token
            Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
            
            if (!tokenOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "Invalid or expired reset token");
                return ResponseEntity.badRequest().body(response);
            }

            PasswordResetToken resetToken = tokenOpt.get();

            // Check if token is expired
            if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
                tokenRepository.delete(resetToken);
                response.put("success", false);
                response.put("message", "Reset token has expired. Please request a new one.");
                return ResponseEntity.badRequest().body(response);
            }

            // Find user
            Optional<User> userOpt = userRepository.findById(resetToken.getUserId());
            
            if (!userOpt.isPresent()) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.badRequest().body(response);
            }

            User user = userOpt.get();

            // Update password
            user.setPassword(newPassword);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);

            // Delete used token
            tokenRepository.delete(resetToken);

            // Send success email
            try {
                emailService.sendPasswordResetSuccessEmail(user.getEmail());
            } catch (Exception e) {
                System.err.println("Failed to send success email: " + e.getMessage());
            }

            response.put("success", true);
            response.put("message", "Password has been reset successfully");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Verify token validity
    @PostMapping("/verify-reset-token")
    public ResponseEntity<Map<String, Object>> verifyResetToken(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String token = request.get("token");

            if (token == null || token.trim().isEmpty()) {
                response.put("valid", false);
                response.put("message", "Token is required");
                return ResponseEntity.badRequest().body(response);
            }

            Optional<PasswordResetToken> tokenOpt = tokenRepository.findByToken(token);
            
            if (!tokenOpt.isPresent()) {
                response.put("valid", false);
                response.put("message", "Invalid token");
                return ResponseEntity.ok(response);
            }

            PasswordResetToken resetToken = tokenOpt.get();

            // Check if token is expired
            if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
                response.put("valid", false);
                response.put("message", "Token has expired");
                return ResponseEntity.ok(response);
            }

            response.put("valid", true);
            response.put("message", "Token is valid");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("valid", false);
            response.put("message", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}

