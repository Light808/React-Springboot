package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
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

import com.example.demo.model.Admin;
import com.example.demo.repository.AdminRepository;
import com.example.demo.repository.MovieRepository;
import com.example.demo.repository.ShowtimeRepository;
import com.example.demo.repository.TicketRepository;
import com.example.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {
    
    @Autowired
    private AdminRepository adminRepository;
    
    @Autowired
    private TicketRepository ticketRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private MovieRepository movieRepository;
    
    @SuppressWarnings("unused")
    @Autowired
    private ShowtimeRepository showtimeRepository;
    
    @PostMapping("/login")
public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginData) {
    try {
        String username = loginData.get("username");
        String password = loginData.get("password");
        String adminKey = loginData.get("adminKey");
        
        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(createErrorResponse("Username and password are required"));
        }
        
        if (adminKey == null || adminKey.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(createErrorResponse("Admin key is required"));
        }
        
        // Admin key
        String validAdminKey = "Tyra2508";
        if (!validAdminKey.equals(adminKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(createErrorResponse("Admin key not valid"));
        }
        
        Optional<Admin> adminOpt = adminRepository.findByUsername(username);
        if (!adminOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(createErrorResponse("Admin account does not exist"));
        }
        
        Admin admin = adminOpt.get();
        if (!admin.getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(createErrorResponse("Wrong password"));
        }
        
        admin.setLastLoginAt(LocalDateTime.now());
        adminRepository.save(admin);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Login successful");
        response.put("admin", createAdminResponse(admin));
        response.put("token", "admin-token-" + admin.getId());
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(createErrorResponse("Error server: " + e.getMessage()));
    }
}
    
    // Logout admin
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(@RequestParam String adminId) {
        try {
            Optional<Admin> adminOpt = adminRepository.findById(adminId);
            if (adminOpt.isPresent()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Logout successful");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Admin not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Get admin profile
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@RequestParam String adminId) {
        try {
            Optional<Admin> adminOpt = adminRepository.findById(adminId);
            if (!adminOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("admin", createAdminResponse(adminOpt.get()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Get dashboard stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        try {
            long totalTickets = ticketRepository.count();
            long totalUsers = userRepository.count();
            long confirmedTickets = ticketRepository.findByStatus("confirmed").size();
            long usedTickets = ticketRepository.findByStatus("used").size();
            long cancelledTickets = ticketRepository.findByStatus("cancelled").size();
            long pendingTickets = ticketRepository.findByStatus("pending").size();

            double totalRevenue = ticketRepository.findAll().stream()
                .filter(ticket -> "confirmed".equals(ticket.getStatus()) || "used".equals(ticket.getStatus()))
                .mapToDouble(ticket -> ticket.getPrice())
                .sum();
            
            // Chart data - Revenue by month (last 6 months)
            Map<String, Double> monthlyRevenue = new HashMap<>();
            String[] months = {"January", "February", "March", "April", "May", "June"};
            for (String month : months) {
                monthlyRevenue.put(month, Math.random() * 20000000 + 10000000);
            }
            
            // Chart data - Ticket sales by day of week
            Map<String, Integer> weeklyTicketSales = new HashMap<>();
            String[] days = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};
            for (String day : days) {
                weeklyTicketSales.put(day, (int)(Math.random() * 100 + 50));
            }
            
            // Chart data - User growth by week (last 4 weeks)
            Map<String, Integer> weeklyUserGrowth = new HashMap<>();
            String[] weeks = {"Week 1", "Week 2", "Week 3", "Week 4"};
            for (String week : weeks) {
                weeklyUserGrowth.put(week, (int)(Math.random() * 20 + 5));
            }
            
            // Most popular movies (by ticket count)
            Map<String, Object> popularMovies = new HashMap<>();
            List<com.example.demo.model.Movie> movies = movieRepository.findAll();
            if (!movies.isEmpty()) {
                popularMovies.put("movie1", movies.get(0).getTitle());
                popularMovies.put("movie2", movies.size() > 1 ? movies.get(1).getTitle() : "N/A");
                popularMovies.put("movie3", movies.size() > 2 ? movies.get(2).getTitle() : "N/A");
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTickets", totalTickets);
            stats.put("totalUsers", totalUsers);
            stats.put("confirmedTickets", confirmedTickets);
            stats.put("usedTickets", usedTickets);
            stats.put("cancelledTickets", cancelledTickets);
            stats.put("pendingTickets", pendingTickets);
            stats.put("totalRevenue", totalRevenue);
            stats.put("monthlyRevenue", monthlyRevenue);
            stats.put("weeklyTicketSales", weeklyTicketSales);
            stats.put("weeklyUserGrowth", weeklyUserGrowth);
            stats.put("popularMovies", popularMovies);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("stats", stats);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Get all admins
    @GetMapping("/admins")
    public ResponseEntity<Map<String, Object>> getAllAdmins() {
        try {
            List<Admin> admins = adminRepository.findAll();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("admins", admins.stream().map(this::createAdminResponse).toArray());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Get all tickets
    @GetMapping("/tickets")
    public ResponseEntity<Map<String, Object>> getAllTickets() {
        try {
            List<com.example.demo.model.Ticket> tickets = ticketRepository.findAll();
            for (com.example.demo.model.Ticket ticket : tickets) {
                if (ticket.getUserId() != null) {
                    Optional<com.example.demo.model.User> userOpt = userRepository.findById(ticket.getUserId());
                    if (userOpt.isPresent()) {
                        com.example.demo.model.User user = userOpt.get();
                        // Add user details to ticket response
                        ticket.setUserName(user.getFullName());
                        ticket.setUserEmail(user.getEmail());
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tickets", tickets);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Get all users
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        try {
            List<com.example.demo.model.User> users = userRepository.findAll();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("users", users);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Get user by ID
    @GetMapping("/users/{userId}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable String userId) {
        try {
            Optional<com.example.demo.model.User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            com.example.demo.model.User user = userOpt.get();
            user.setPassword(null);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Create new user
    @PostMapping("/users")
    public ResponseEntity<Map<String, Object>> createUser(@RequestBody Map<String, Object> userData) {
        try {
            String username = (String) userData.get("username");
            String password = (String) userData.get("password");
            String fullName = (String) userData.get("fullName");
            String email = (String) userData.get("email");
            String phone = (String) userData.get("phone");
            String address = (String) userData.get("address");
            String notes = (String) userData.get("notes");
            
            // Validation
            if (username == null || username.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Username not be empty"));
            }
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Password not be empty"));
            }
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Email not be empty"));
            }

            if (userRepository.existsByUsername(username)) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Username has existed"));
            }

            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Email has existed"));
            }

            com.example.demo.model.User newUser = new com.example.demo.model.User();
            newUser.setUsername(username);
            newUser.setPassword(password);
            newUser.setFullName(fullName);
            newUser.setEmail(email);
            newUser.setPhone(phone);
            newUser.setAddress(address);
            newUser.setNotes(notes);
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setUpdatedAt(LocalDateTime.now());
            
            com.example.demo.model.User savedUser = userRepository.save(newUser);
            savedUser.setPassword(null);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Create user successfully");
            response.put("user", savedUser);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // update user
    @PutMapping("/users/{userId}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable String userId, @RequestBody Map<String, Object> userData) {
        try {
            Optional<com.example.demo.model.User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            com.example.demo.model.User user = userOpt.get();

            if (userData.containsKey("fullName")) {
                user.setFullName((String) userData.get("fullName"));
            }

            if (userData.containsKey("email")) {
                String newEmail = (String) userData.get("email");
                // Check duplicate email
                if (!user.getEmail().equals(newEmail) && userRepository.existsByEmail(newEmail)) {
                    return ResponseEntity.badRequest()
                        .body(createErrorResponse("Email has existed"));
                }
                user.setEmail(newEmail);
            }
            if (userData.containsKey("phone")) {
                user.setPhone((String) userData.get("phone"));
            }
            if (userData.containsKey("address")) {
                user.setAddress((String) userData.get("address"));
            }
            if (userData.containsKey("notes")) {
                user.setNotes((String) userData.get("notes"));
            }
            
            // Set updatedAt timestamp
            user.setUpdatedAt(LocalDateTime.now());
            
            com.example.demo.model.User updatedUser = userRepository.save(user);
            updatedUser.setPassword(null); 
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Update user successfully");
            response.put("user", updatedUser);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Delete user
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable String userId) {
        try {
            Optional<com.example.demo.model.User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            userRepository.deleteById(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Delete user successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    
    // Search users 
    @GetMapping("/users/search")
    public ResponseEntity<Map<String, Object>> searchUsers(@RequestParam String keyword) {
        try {
            List<com.example.demo.model.User> users = userRepository.findAll().stream()
                .filter(user -> 
                    user.getUsername().toLowerCase().contains(keyword.toLowerCase()) ||
                    user.getFullName().toLowerCase().contains(keyword.toLowerCase()) ||
                    user.getEmail().toLowerCase().contains(keyword.toLowerCase())
                )
                .collect(java.util.stream.Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("users", users);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Update ticket status
    @PostMapping("/tickets/{ticketId}/status")
    public ResponseEntity<Map<String, Object>> updateTicketStatus(
            @PathVariable String ticketId,
            @RequestBody Map<String, String> statusData) {
        try {
            String newStatus = statusData.get("status");
            if (newStatus == null || newStatus.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Status is required"));
            }
            
            Optional<com.example.demo.model.Ticket> ticketOpt = ticketRepository.findById(ticketId);
            if (!ticketOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            com.example.demo.model.Ticket ticket = ticketOpt.get();
            ticket.setStatus(newStatus);
            ticketRepository.save(ticket);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Update ticket status successfully");
            response.put("ticket", ticket);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    // Create new admin (Just super_admin)
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createAdmin(@RequestBody Admin adminData) {
        try {

            if (adminRepository.existsByUsername(adminData.getUsername())) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Username has existed"));
            }
            
            if (adminData.getEmail() != null && adminRepository.existsByEmail(adminData.getEmail())) {
                return ResponseEntity.badRequest()
                    .body(createErrorResponse("Email has existed"));
            }
            
            Admin newAdmin = new Admin();
            newAdmin.setUsername(adminData.getUsername());
            newAdmin.setPassword(adminData.getPassword());
            newAdmin.setFullName(adminData.getFullName());
            newAdmin.setEmail(adminData.getEmail());
            newAdmin.setPhone(adminData.getPhone());
            newAdmin.setRole(adminData.getRole() != null ? adminData.getRole() : "admin");
            newAdmin.setNotes(adminData.getNotes());
            
            Admin savedAdmin = adminRepository.save(newAdmin);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Create admin successfully");
            response.put("admin", createAdminResponse(savedAdmin));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error server: " + e.getMessage()));
        }
    }
    
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
    
    private Map<String, Object> createAdminResponse(Admin admin) {
        Map<String, Object> adminResponse = new HashMap<>();
        adminResponse.put("id", admin.getId());
        adminResponse.put("username", admin.getUsername());
        adminResponse.put("fullName", admin.getFullName());
        adminResponse.put("email", admin.getEmail());
        adminResponse.put("phone", admin.getPhone());
        adminResponse.put("role", admin.getRole());
        adminResponse.put("createdAt", admin.getCreatedAt());
        adminResponse.put("lastLoginAt", admin.getLastLoginAt());
        adminResponse.put("notes", admin.getNotes());
        return adminResponse;
    }
}
