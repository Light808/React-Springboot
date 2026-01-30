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
import com.example.demo.service.FaceRecognitionService;
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
    
    @Autowired
    private FaceRecognitionService faceRecognitionService;

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

    @PutMapping("/{id}/avatar")
    public ResponseEntity<User> updateAvatar(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            Optional<User> u = userRepository.findById(id);
            if (!u.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            User user = u.get();
            if (body.containsKey("avatar")) {
                Object v = body.get("avatar");
                user.setAvatar(v == null || "".equals(v) ? null : v.toString());
            }
            userRepository.save(user);
            user.setPassword(null);
            return ResponseEntity.ok(user);
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
    
    // Register face descriptor for a user
    @PostMapping("/{id}/register-face")
    public ResponseEntity<Map<String, Object>> registerFace(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            @SuppressWarnings("unchecked")
            List<Double> faceDescriptor = (List<Double>) request.get("faceDescriptor");
            
            if (faceDescriptor == null || faceDescriptor.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            user.setFaceDescriptor(faceDescriptor);
            user.setUpdatedAt(java.time.LocalDateTime.now());
            userRepository.save(user);
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "Face registered successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Register face error: " + e.getMessage());
            Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to register face: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Verify face descriptor for login
    @PostMapping("/verify-face")
    public ResponseEntity<Object> verifyFace(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Double> inputDescriptor = (List<Double>) request.get("faceDescriptor");
            
            if (inputDescriptor == null || inputDescriptor.isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            // Get all users with face descriptors
            List<User> allUsers = userRepository.findAll();
            User matchedUser = null;
            double bestSimilarity = 0.0;
            
            // Normalize input descriptor
            List<Double> normalizedInput = normalizeDescriptor(inputDescriptor);
            
            for (User user : allUsers) {
                if (user.getFaceDescriptor() != null && !user.getFaceDescriptor().isEmpty()) {
                    // Normalize stored descriptor
                    List<Double> normalizedStored = normalizeDescriptor(user.getFaceDescriptor());
                    
                    double similarity = faceRecognitionService.calculateSimilarity(
                            normalizedInput, normalizedStored);
                    
                    System.out.println("Comparing with user " + user.getUsername() + ": similarity = " + String.format("%.4f", similarity));
                    
                    if (similarity > bestSimilarity) {
                        bestSimilarity = similarity;
                        // Match with the highest similarity (no threshold check)
                        matchedUser = user;
                    }
                }
            }
            
            System.out.println("Best similarity found: " + String.format("%.4f", bestSimilarity));
            
            // Accept any face match that exceeds the threshold
            if (matchedUser != null && bestSimilarity > FaceRecognitionService.SIMILARITY_THRESHOLD) {
                System.out.println("Face matched with user: " + matchedUser.getUsername() + " (similarity: " + String.format("%.4f", bestSimilarity) + ")");
                matchedUser.setLastLoginAt(java.time.LocalDateTime.now());
                userRepository.save(matchedUser);
                matchedUser.setPassword(null);
                return ResponseEntity.ok(matchedUser);
            } else {
                // Return error with similarity details for debugging
                java.util.Map<String, Object> errorResponse = new java.util.HashMap<>();
                errorResponse.put("message", "Face does not match");
                errorResponse.put("bestSimilarity", bestSimilarity);
                errorResponse.put("threshold", FaceRecognitionService.SIMILARITY_THRESHOLD);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
        } catch (Exception e) {
            System.err.println("Verify face error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Helper method to normalize descriptor
    private List<Double> normalizeDescriptor(List<Double> descriptor) {
        double norm = 0.0;
        for (Double val : descriptor) {
            norm += val * val;
        }
        norm = Math.sqrt(norm);
        
        if (norm == 0.0) {
            return descriptor;
        }
        
        List<Double> normalized = new java.util.ArrayList<>();
        for (Double val : descriptor) {
            normalized.add(val / norm);
        }
        return normalized;
    }
    
    // Check if user has registered face
    @GetMapping("/{id}/has-face")
    public ResponseEntity<Map<String, Boolean>> hasFace(@PathVariable String id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            boolean hasFace = user.getFaceDescriptor() != null && !user.getFaceDescriptor().isEmpty();
            
            Map<String, Boolean> response = new java.util.HashMap<>();
            response.put("hasFace", hasFace);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Delete/disable Face ID for a user
    @DeleteMapping("/{id}/delete-face")
    public ResponseEntity<Map<String, Object>> deleteFace(@PathVariable String id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            user.setFaceDescriptor(null);
            user.setUpdatedAt(java.time.LocalDateTime.now());
            userRepository.save(user);
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", "Face ID disabled successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Delete face error: " + e.getMessage());
            Map<String, Object> errorResponse = new java.util.HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to delete face: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
