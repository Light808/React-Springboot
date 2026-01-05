package com.example.demo.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Contact;
import com.example.demo.repository.ContactRepository;

@RestController
@RequestMapping("/api/contacts")
@CrossOrigin(origins = "*")
public class ContactController {

    @Autowired
    private ContactRepository contactRepository;

    // POST /api/contacts - Submit contact form
    @PostMapping
    public ResponseEntity<Map<String, Object>> submitContact(@RequestBody Contact contact) {
        try {
            // Validate required fields
            if (contact.getName() == null || contact.getName().trim().isEmpty() ||
                contact.getEmail() == null || contact.getEmail().trim().isEmpty() ||
                contact.getMessage() == null || contact.getMessage().trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Name, email, and message are required");
                return ResponseEntity.badRequest().body(error);
            }

            // Save contact to database
            Contact savedContact = contactRepository.save(contact);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Contact form submitted successfully");
            response.put("id", savedContact.getId());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to submit contact form: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // GET /api/contacts - Get all contacts (for admin)
    @GetMapping
    public ResponseEntity<List<Contact>> getAllContacts() {
        try {
            List<Contact> contacts = contactRepository.findAllByOrderByCreatedAtDesc();
            return ResponseEntity.ok(contacts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Contact>> getUnreadContacts() {
        try {
            List<Contact> unreadContacts = contactRepository.findByIsRead(false);
            return ResponseEntity.ok(unreadContacts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

