package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Complaint;
import com.example.demo.repository.ComplaintRepository;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    @Autowired
    private ComplaintRepository complaintRepository;

    // POST /api/complaints - Submit complaint
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitComplaint(@RequestBody Complaint complaint) {
        try {
            // Validate required fields
            if (complaint.getName() == null || complaint.getName().trim().isEmpty() ||
                complaint.getEmail() == null || complaint.getEmail().trim().isEmpty() ||
                complaint.getDescription() == null || complaint.getDescription().trim().isEmpty() ||
                complaint.getCategory() == null || complaint.getCategory().trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Name, email, category, and description are required");
                return ResponseEntity.badRequest().body(error);
            }

            // Set default values
            if (complaint.getStatus() == null || complaint.getStatus().trim().isEmpty()) {
                complaint.setStatus("pending");
            }
            if (complaint.getCreatedAt() == null) {
                complaint.setCreatedAt(LocalDateTime.now());
            }
            complaint.setRead(false);

            // Save complaint to database
            Complaint savedComplaint = complaintRepository.save(complaint);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Complaint submitted successfully");
            response.put("id", savedComplaint.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to submit complaint: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET /api/complaints - Get all complaints (for admin)
    @GetMapping
    public ResponseEntity<List<Complaint>> getAllComplaints() {
        try {
            List<Complaint> complaints = complaintRepository.findAllByOrderByCreatedAtDesc();
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // GET /api/complaints/unread - Get unread complaints (for admin)
    @GetMapping("/unread")
    public ResponseEntity<List<Complaint>> getUnreadComplaints() {
        try {
            List<Complaint> unreadComplaints = complaintRepository.findByIsRead(false);
            return ResponseEntity.ok(unreadComplaints);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // GET /api/complaints/status/{status} - Get complaints by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Complaint>> getComplaintsByStatus(@PathVariable String status) {
        try {
            List<Complaint> complaints = complaintRepository.findByStatusOrderByCreatedAtDesc(status);
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // GET /api/complaints/{id} - Get complaint by ID
    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaintById(@PathVariable String id) {
        try {
            return complaintRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // PUT /api/complaints/{id}/status - Update complaint status (for admin)
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateComplaintStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            return complaintRepository.findById(id)
                .map(complaint -> {
                    String newStatus = request.get("status");
                    if (newStatus != null && !newStatus.trim().isEmpty()) {
                        complaint.setStatus(newStatus);
                        complaint.setUpdatedAt(LocalDateTime.now());
                        complaintRepository.save(complaint);
                        
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", "Complaint status updated successfully");
                        return ResponseEntity.ok(response);
                    } else {
                        Map<String, Object> error = new HashMap<>();
                        error.put("success", false);
                        error.put("message", "Status is required");
                        return ResponseEntity.badRequest().body(error);
                    }
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to update complaint status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

