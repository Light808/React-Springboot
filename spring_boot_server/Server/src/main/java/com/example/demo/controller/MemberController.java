package com.example.demo.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Ticket;
import com.example.demo.model.User;
import com.example.demo.repository.TicketRepository;
import com.example.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/members")
@CrossOrigin(origins = "*")
public class MemberController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TicketRepository ticketRepository;

    @GetMapping("/{id}/overview")
    public ResponseEntity<Map<String, Object>> getMemberOverview(@PathVariable String id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();
            
            // Get user's tickets to calculate points and tier
            List<Ticket> tickets = ticketRepository.findByUserId(id);
            double totalSpent = tickets.stream()
                .mapToDouble(Ticket::getPrice)
                .sum();
            
            // Calculate points (5% of total spending)
            int points = (int) Math.floor(totalSpent * 0.05);
            
            // Determine tier based on spending (in VND)
            String tier = "Member";
            if (totalSpent >= 3000000) {
                tier = "VVIP";
            } else if (totalSpent >= 1000000) {
                tier = "VIP";
            }
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("name", user.getFullName() != null ? user.getFullName() : user.getUsername());
            response.put("tier", tier);
            response.put("points", points);
            
            // Promotions based on tier
            List<String> promotions = new ArrayList<>();
            promotions.add("Promotion for " + tier + " tier");
            if (tier.equals("VIP")) {
                promotions.add("1.2x benefits, discounted combos");
            } else if (tier.equals("VVIP")) {
                promotions.add("1.5x benefits, special screenings, event priority");
            }
            response.put("promotions", promotions);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error fetching member overview: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/{id}/transactions")
    public ResponseEntity<List<Map<String, Object>>> getMemberTransactions(@PathVariable String id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (!userOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            List<Ticket> tickets = ticketRepository.findByUserIdOrderByBookingTimeDesc(id);
            List<Map<String, Object>> transactions = new ArrayList<>();
            
            for (Ticket ticket : tickets) {
                Map<String, Object> transaction = new HashMap<>();
                transaction.put("type", "Buy ticket");
                transaction.put("amount", ticket.getPrice());
                
                // Use bookingTime or current time if not available
                String timeStr = ticket.getBookingTime();
                if (timeStr == null || timeStr.isEmpty()) {
                    timeStr = LocalDateTime.now().toString();
                }
                transaction.put("time", timeStr);
                
                // Optional: Add more details
                transaction.put("movieTitle", ticket.getMovieTitle());
                transaction.put("cinemaName", ticket.getCinemaName());
                transaction.put("status", ticket.getStatus());
                
                transactions.add(transaction);
            }
            
            return ResponseEntity.ok(transactions);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}

