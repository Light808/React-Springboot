package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.FacebookOAuthService;
import com.example.demo.service.GoogleOAuthConfigService;
import com.example.demo.service.GoogleOAuthService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private GoogleOAuthService googleOAuthService;
    
    @Autowired
    private GoogleOAuthConfigService googleOAuthConfigService;
    
    @Autowired
    private FacebookOAuthService facebookOAuthService;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        try {
            Optional<User> user = userRepository.findById(id);
            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        try {
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            if (userRepository.existsByUsername(user.getUsername())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }

            if (userRepository.existsByEmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }

            User savedUser = userRepository.save(user);
            savedUser.setPassword(null);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, @RequestBody User user) {
        try {
            if (!userRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            // Get existing user data to preserve fields not being updated
            Optional<User> existingUserOpt = userRepository.findById(id);
            if (!existingUserOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User existingUser = existingUserOpt.get();
            
            // Just update fields that are provided in the request
            if (user.getUsername() != null) {
                existingUser.setUsername(user.getUsername());
            }
            if (user.getEmail() != null) {
                existingUser.setEmail(user.getEmail());
            }
            if (user.getFullName() != null) {
                existingUser.setFullName(user.getFullName());
            }
            if (user.getPhone() != null) {
                existingUser.setPhone(user.getPhone());
            }
            if (user.getAddress() != null) {
                existingUser.setAddress(user.getAddress());
            }
            if (user.getNotes() != null) {
                existingUser.setNotes(user.getNotes());
            }
            if (user.getAvatar() != null) {
                existingUser.setAvatar(user.getAvatar());
            }
            // Just update password if it's provided and not empty
            if (user.getPassword() != null && !user.getPassword().trim().isEmpty()) {
                existingUser.setPassword(user.getPassword());
            }

            User updatedUser = userRepository.save(existingUser);
            updatedUser.setPassword(null); 
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        try {
            if (!userRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            userRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Authentication endpoints
    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        try {
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (userRepository.existsByUsername(user.getUsername())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            if (userRepository.existsByEmail(user.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }

            User savedUser = userRepository.save(user);
            savedUser.setPassword(null);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<User> login(@RequestParam String username, @RequestParam String password) {
        try {
            Optional<User> userOpt = userRepository.findByUsernameAndPassword(username, password);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                // update last login time
                user.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                user.setPassword(null);
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/check-username")
    public ResponseEntity<Boolean> checkUsername(@RequestParam String username) {
        try {
            boolean exists = userRepository.existsByUsername(username);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmail(@RequestParam String email) {
        try {
            boolean exists = userRepository.existsByEmail(email);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // update last login time
    @PostMapping("/{id}/update-login")
    public ResponseEntity<User> updateLastLogin(@PathVariable String id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                user.setPassword(null);
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get user profile 
    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(@RequestParam String userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setPassword(null);
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Update user profile (for user to update their own profile)
    @PutMapping("/profile/{userId}")
    public ResponseEntity<User> updateProfile(@PathVariable String userId, @RequestBody User userData) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();

            if (userData.getFullName() != null && !userData.getFullName().trim().isEmpty()) {
                user.setFullName(userData.getFullName());
            }
            if (userData.getEmail() != null && !userData.getEmail().trim().isEmpty()) {
                String newEmail = userData.getEmail();
                // Check duplicate email
                if (!user.getEmail().equals(newEmail) && userRepository.existsByEmail(newEmail)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).build();
                }
                user.setEmail(newEmail);
            }
            if (userData.getPhone() != null) {
                user.setPhone(userData.getPhone());
            }
            if (userData.getAddress() != null) {
                user.setAddress(userData.getAddress());
            }
            
            User updatedUser = userRepository.save(user);
            updatedUser.setPassword(null);
            return ResponseEntity.ok(updatedUser);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Change password (user must provide current password)
    @PostMapping("/change-password/{userId}")
    public ResponseEntity<User> changePassword(@PathVariable String userId, @RequestBody Map<String, String> passwordData) {
        try {
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");
            
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            if (!user.getPassword().equals(currentPassword)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            user.setPassword(newPassword);
            User updatedUser = userRepository.save(user);
            updatedUser.setPassword(null);
            return ResponseEntity.ok(updatedUser);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Admin reset user password (no need to provide current password)
    @PostMapping("/admin/reset-password/{userId}")
    public ResponseEntity<User> adminResetPassword(@PathVariable String userId, @RequestBody Map<String, String> passwordData) {
        try {
            String newPassword = passwordData.get("newPassword");
            
            if (newPassword == null || newPassword.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            user.setPassword(newPassword);
            User updatedUser = userRepository.save(user);
            updatedUser.setPassword(null);
            return ResponseEntity.ok(updatedUser);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Google OAuth login endpoint with token verification
    @PostMapping("/google-login")
    public ResponseEntity<User> googleLogin(@RequestBody Map<String, String> googleData) {
        try {
            String idToken = googleData.get("idToken");
            
            if (idToken == null || idToken.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Verify Google ID token
            GoogleOAuthService.GoogleUserInfo googleUserInfo = googleOAuthService.verifyAndExtractUserInfo(idToken);
            
            if (googleUserInfo == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String googleId = googleUserInfo.getGoogleId();
            String email = googleUserInfo.getEmail();
            String fullName = googleUserInfo.getName();
            String profilePicture = googleUserInfo.getPictureUrl();
            
            // Check if user already exists with this Google ID
            Optional<User> existingUser = userRepository.findByGoogleId(googleId);
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                user.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                user.setPassword(null);
                return ResponseEntity.ok(user);
            }
            
            // Check if user exists with same email but different provider
            Optional<User> emailUser = userRepository.findByEmail(email);
            if (emailUser.isPresent()) {
                // Link Google account to existing user
                User user = emailUser.get();
                user.setGoogleId(googleId);
                user.setProvider("google");
                user.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                user.setPassword(null);
                return ResponseEntity.ok(user);
            }
            
            // Create new user with Google OAuth
            User newUser = new User(googleId, fullName, email);
            if (profilePicture != null && !profilePicture.isEmpty()) {
                newUser.setAvatar(profilePicture);
            }
            newUser.setLastLoginAt(java.time.LocalDateTime.now());
            
            User savedUser = userRepository.save(newUser);
            savedUser.setPassword(null);
            return ResponseEntity.ok(savedUser);
            
        } catch (Exception e) {
            System.err.println("Google login error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Legacy Google OAuth login endpoint (for backward compatibility)
    @PostMapping("/google-login-legacy")
    public ResponseEntity<User> googleLoginLegacy(@RequestBody Map<String, String> googleData) {
        try {
            String googleId = googleData.get("googleId");
            String email = googleData.get("email");
            String fullName = googleData.get("fullName");
            String profilePicture = googleData.get("profilePicture");
            
            if (googleId == null || email == null || fullName == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Check if user already exists with this Google ID
            Optional<User> existingUser = userRepository.findByGoogleId(googleId);
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                user.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                user.setPassword(null);
                return ResponseEntity.ok(user);
            }
            
            // Check if user exists with same email but different provider
            Optional<User> emailUser = userRepository.findByEmail(email);
            if (emailUser.isPresent()) {
                // Link Google account to existing user
                User user = emailUser.get();
                user.setGoogleId(googleId);
                user.setProvider("google");
                user.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                user.setPassword(null);
                return ResponseEntity.ok(user);
            }
            
            // Create new user with Google OAuth
            User newUser = new User(googleId, fullName, email);
            if (profilePicture != null && !profilePicture.isEmpty()) {
                newUser.setAvatar(profilePicture);
            }
            newUser.setLastLoginAt(java.time.LocalDateTime.now());
            
            User savedUser = userRepository.save(newUser);
            savedUser.setPassword(null);
            return ResponseEntity.ok(savedUser);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Check if Google ID exists
    @GetMapping("/check-google-id")
    public ResponseEntity<Boolean> checkGoogleId(@RequestParam String googleId) {
        try {
            boolean exists = userRepository.existsByGoogleId(googleId);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get Google OAuth configuration for frontend
    @GetMapping("/google-oauth-config")
    public ResponseEntity<Map<String, String>> getGoogleOAuthConfig() {
        try {
            Map<String, String> config = googleOAuthConfigService.getOAuthConfig();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Facebook OAuth login endpoint
    @PostMapping("/facebook-login")
    public ResponseEntity<User> facebookLogin(@RequestBody Map<String, String> facebookData) {
        try {
            String facebookId = facebookData.get("id");
            String email = facebookData.get("email");
            String fullName = facebookData.get("name");
            String profilePicture = facebookData.get("picture");
            
            if (facebookId == null || fullName == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Check if user already exists with this Facebook ID
            Optional<User> existingUser = userRepository.findByFacebookId(facebookId);
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                user.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                user.setPassword(null);
                return ResponseEntity.ok(user);
            }
            
            // Check if user exists with same email but different provider
            Optional<User> emailUser = userRepository.findByEmail(email);
            if (emailUser.isPresent()) {
                // Link Facebook account to existing user
                User user = emailUser.get();
                user.setFacebookId(facebookId);
                user.setProvider("facebook");
                user.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(user);
                user.setPassword(null);
                return ResponseEntity.ok(user);
            }
            
            // Create new user with Facebook OAuth
            User newUser = new User(facebookId, fullName, email, "facebook");
            if (profilePicture != null && !profilePicture.isEmpty()) {
                newUser.setAvatar(profilePicture);
            }
            newUser.setLastLoginAt(java.time.LocalDateTime.now());
            
            User savedUser = userRepository.save(newUser);
            savedUser.setPassword(null);
            return ResponseEntity.ok(savedUser);
            
        } catch (Exception e) {
            System.err.println("Facebook login error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get Facebook OAuth configuration for frontend
    @GetMapping("/facebook-oauth-config")
    public ResponseEntity<Map<String, String>> getFacebookOAuthConfig() {
        try {
            Map<String, String> config = facebookOAuthService.getOAuthConfig();
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Check if Facebook ID exists
    @GetMapping("/check-facebook-id")
    public ResponseEntity<Boolean> checkFacebookId(@RequestParam String facebookId) {
        try {
            boolean exists = userRepository.existsByFacebookId(facebookId);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
