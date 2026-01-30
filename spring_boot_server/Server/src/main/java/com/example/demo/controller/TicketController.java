package com.example.demo.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

import com.example.demo.model.Notification;
import com.example.demo.model.Ticket;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.TicketRepository;
import com.example.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {
    @Autowired
    private TicketRepository ticketRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Ticket> getTicketById(@PathVariable String id) {
        return ticketRepository.findById(id);
    }

    // Get tickets by user ID
    @GetMapping("/user/{userId}")
    public List<Ticket> getTicketsByUser(@PathVariable String userId) {
        return ticketRepository.findByUserId(userId);
    }

    @PostMapping
    public Ticket createTicket(@RequestBody Ticket ticket) {
        if (ticket.getBookingTime() == null || ticket.getBookingTime().isEmpty()) {
            ticket.setBookingTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        }
        
        // Auto create ticket number and QR code
        if (ticket.getTicketNumber() == null || ticket.getTicketNumber().isEmpty()) {
            ticket.setTicketNumber("TK" + System.currentTimeMillis());
        }
        if (ticket.getQrCode() == null || ticket.getQrCode().isEmpty()) {
            ticket.setQrCode(UUID.randomUUID().toString());
        }
        
        // Set default values
        if (ticket.getStatus() == null || ticket.getStatus().isEmpty()) {
            ticket.setStatus("confirmed");
        }
        if (ticket.getPaymentStatus() == null || ticket.getPaymentStatus().isEmpty()) {
            ticket.setPaymentStatus("paid");
        }
        if (!ticket.isRefundable()) {
            ticket.setRefundable(true);
        }
        
        // Save user info into ticket
        if (ticket.getUserId() != null) {
            Optional<com.example.demo.model.User> userOpt = userRepository.findById(ticket.getUserId());
            if (userOpt.isPresent()) {
                com.example.demo.model.User user = userOpt.get();
                ticket.setUserName(user.getFullName());
                ticket.setUserEmail(user.getEmail());
            }
        }
        
        return ticketRepository.save(ticket);
    }

    // Book a ticket
    @PostMapping("/book")
    public ResponseEntity<?> bookTicket(@RequestBody Ticket ticket) {
        try {
            // Validate required fields
            if (ticket.getUserId() == null || ticket.getUserId().isEmpty()) {
                return ResponseEntity.badRequest().body("User ID is required");
            }
            if (ticket.getShowtimeId() == null || ticket.getShowtimeId().isEmpty()) {
                return ResponseEntity.badRequest().body("Showtime ID is required");
            }
            if (ticket.getMovieId() == null || ticket.getMovieId().isEmpty()) {
                return ResponseEntity.badRequest().body("Movie ID is required");
            }
            if (ticket.getSeatNumber() == null || ticket.getSeatNumber().isEmpty()) {
                return ResponseEntity.badRequest().body("Seat number is required");
            }
            
            if (ticket.getBookingTime() == null || ticket.getBookingTime().isEmpty()) {
                ticket.setBookingTime(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            }
            
            // Auto create ticket number and QR code
            if (ticket.getTicketNumber() == null || ticket.getTicketNumber().isEmpty()) {
                ticket.setTicketNumber("TK" + System.currentTimeMillis());
            }
            if (ticket.getQrCode() == null || ticket.getQrCode().isEmpty()) {
                ticket.setQrCode(UUID.randomUUID().toString());
            }
            
            // Set default values
            if (ticket.getStatus() == null || ticket.getStatus().isEmpty()) {
                ticket.setStatus("confirmed");
            }
            if (ticket.getPaymentStatus() == null || ticket.getPaymentStatus().isEmpty()) {
                ticket.setPaymentStatus("paid");
            }
            // Set default refundable status (boolean field, no null check needed)
            if (!ticket.isRefundable()) {
                ticket.setRefundable(true);
            }
            
            // save user info into ticket
            if (ticket.getUserId() != null) {
                Optional<com.example.demo.model.User> userOpt = userRepository.findById(ticket.getUserId());
                if (userOpt.isPresent()) {
                    com.example.demo.model.User user = userOpt.get();
                    ticket.setUserName(user.getFullName());
                    ticket.setUserEmail(user.getEmail());
                }
            }
            
            Ticket savedTicket = ticketRepository.save(ticket);
            return ResponseEntity.ok(savedTicket);
        } catch (Exception e) {
            System.err.println("Error creating ticket: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error creating ticket: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Ticket updateTicket(@PathVariable String id, @RequestBody Ticket ticket) {
        ticket.setId(id);
        return ticketRepository.save(ticket);
    }

    @DeleteMapping("/{id}")
    public void deleteTicket(@PathVariable String id) {
        ticketRepository.deleteById(id);
    }

    // cancel a ticket
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Ticket> cancelTicket(@PathVariable String id, @RequestParam(required = false) String reason) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (!ticketOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Ticket ticket = ticketOpt.get();
        if (!"confirmed".equals(ticket.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        
        ticket.setStatus("cancelled");
        ticket.setCancelledAt(LocalDateTime.now());
        ticket.setCancellationReason(reason != null ? reason : "User cancelled");
        
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }

    // Mark a ticket as used
    @PutMapping("/{id}/use")
    public ResponseEntity<Ticket> markTicketAsUsed(@PathVariable String id) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (!ticketOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Ticket ticket = ticketOpt.get();
        if (!"confirmed".equals(ticket.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        
        ticket.setStatus("used");
        ticket.setUsedAt(LocalDateTime.now());
        
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }

    // Get tickets by status
    @GetMapping("/status/{status}")
    public List<Ticket> getTicketsByStatus(@PathVariable String status) {
        return ticketRepository.findByStatus(status);
    }

    // Get tickets by showtime ID
    @GetMapping("/showtime/{showtimeId}")
    public List<Ticket> getTicketsByShowtime(@PathVariable String showtimeId) {
        return ticketRepository.findByShowtimeId(showtimeId);
    }

    // Download ticket as PDF
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadTicket(@PathVariable String id) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (!ticketOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Ticket ticket = ticketOpt.get();

        // create a simple text-based PDF representation
        String pdfContent = generateTicketPDF(ticket);
        byte[] pdfBytes = pdfContent.getBytes();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "ticket_" + ticket.getTicketNumber() + ".pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    // export tickets of a user to PDF or Excel
    @GetMapping("/user/{userId}/export")
    public ResponseEntity<byte[]> exportUserTickets(@PathVariable String userId, @RequestParam(defaultValue = "pdf") String format) {
        List<Ticket> tickets = ticketRepository.findByUserId(userId);
        
        if (tickets.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        byte[] exportData;
        String filename;
        MediaType contentType;
        
        if ("excel".equalsIgnoreCase(format)) {
            exportData = generateExcelExport(tickets);
            filename = "tickets_" + userId + ".xlsx";
            contentType = MediaType.APPLICATION_OCTET_STREAM;
        } else {
            exportData = generatePDFExport(tickets);
            filename = "tickets_" + userId + ".pdf";
            contentType = MediaType.APPLICATION_PDF;
        }
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(contentType);
        headers.setContentDispositionFormData("attachment", filename);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(exportData);
    }

    // Get statistics of tickets for a user
    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<Object> getUserTicketStats(@PathVariable String userId) {
        List<Ticket> tickets = ticketRepository.findByUserId(userId);
        
        return ResponseEntity.ok(new Object() {
            @SuppressWarnings("unused")
            public final long totalTickets = tickets.size();
            @SuppressWarnings("unused")
            public final long confirmedTickets = tickets.stream().filter(t -> "confirmed".equals(t.getStatus())).count();
            @SuppressWarnings("unused")
            public final long usedTickets = tickets.stream().filter(t -> "used".equals(t.getStatus())).count();
            @SuppressWarnings("unused")
            public final long cancelledTickets = tickets.stream().filter(t -> "cancelled".equals(t.getStatus())).count();
            @SuppressWarnings("unused")
            public final double totalSpent = tickets.stream().mapToDouble(Ticket::getPrice).sum();
            @SuppressWarnings("unused")
            public final long refundedTickets = tickets.stream().filter(t -> t.getRefundedAt() != null).count();
            @SuppressWarnings("unused")
            public final double totalRefundAmount = tickets.stream()
                    .filter(t -> t.getRefundedAt() != null)
                    .mapToDouble(Ticket::getRefundAmount)
                    .sum();
        });
    }

    // Get detailed info of a ticket
    @GetMapping("/{id}/details")
    public ResponseEntity<Ticket> getTicketDetails(@PathVariable String id) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (!ticketOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ticketOpt.get());
    }


    // Get info related to payment of a ticket
    @GetMapping("/{id}/payment-info")
    public ResponseEntity<Object> getTicketPaymentInfo(@PathVariable String id) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (!ticketOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Ticket ticket = ticketOpt.get();
        return ResponseEntity.ok(new Object() {
            @SuppressWarnings("unused")
            public final String paymentMethod = ticket.getPaymentMethod();
            @SuppressWarnings("unused")
            public final String paymentStatus = ticket.getPaymentStatus();
            @SuppressWarnings("unused")
            public final double price = ticket.getPrice();
            @SuppressWarnings("unused")
            public final String bookingTime = ticket.getBookingTime();
        });
    }

    // Hoàn tiền vé
    @PutMapping("/{id}/refund")
    public ResponseEntity<Ticket> refundTicket(@PathVariable String id, @RequestParam double refundAmount, @RequestParam String refundReason) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (!ticketOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Ticket ticket = ticketOpt.get();
        if (!"cancelled".equals(ticket.getStatus())) {
            return ResponseEntity.badRequest().build();
        }
        
        if (!ticket.isRefundable()) {
            return ResponseEntity.badRequest().build();
        }
        
        ticket.setRefundAmount(refundAmount);
        ticket.setRefundedAt(LocalDateTime.now());
        ticket.setRefundReason(refundReason);
        
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }

    // Get all refunded tickets
    @GetMapping("/refunded")
    public List<Ticket> getRefundedTickets() {
        return ticketRepository.findAll().stream()
                .filter(ticket -> ticket.getRefundedAt() != null)
                .collect(java.util.stream.Collectors.toList());
    }

    // Get statistics of refunded tickets for a user
    @GetMapping("/user/{userId}/refund-stats")
    public ResponseEntity<Object> getUserRefundStats(@PathVariable String userId) {
        List<Ticket> tickets = ticketRepository.findByUserId(userId);
        
        List<Ticket> refundedTickets = tickets.stream()
                .filter(ticket -> ticket.getRefundedAt() != null)
                .collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(new Object() {
            public final long totalRefundedTickets = refundedTickets.size();
            public final double totalRefundAmount = refundedTickets.stream()
                    .mapToDouble(Ticket::getRefundAmount)
                    .sum();
            @SuppressWarnings("unused")
            public final double averageRefundAmount = totalRefundedTickets > 0 ? 
                    totalRefundAmount / totalRefundedTickets : 0;
        });
    }

    // update payment method of a ticket
    @PutMapping("/{id}/payment-method")
    public ResponseEntity<Ticket> updatePaymentMethod(@PathVariable String id, @RequestParam String paymentMethod) {
        Optional<Ticket> ticketOpt = ticketRepository.findById(id);
        if (!ticketOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Ticket ticket = ticketOpt.get();
        ticket.setPaymentMethod(paymentMethod);
        
        return ResponseEntity.ok(ticketRepository.save(ticket));
    }

    // Get tickets by payment method
    @GetMapping("/payment-method/{paymentMethod}")
    public List<Ticket> getTicketsByPaymentMethod(@PathVariable String paymentMethod) {
        return ticketRepository.findAll().stream()
                .filter(ticket -> paymentMethod.equals(ticket.getPaymentMethod()))
                .collect(java.util.stream.Collectors.toList());
    }

    // Get tickets by cinema address
    @GetMapping("/cinema-address/{address}")
    public List<Ticket> getTicketsByCinemaAddress(@PathVariable String address) {
        return ticketRepository.findAll().stream()
                .filter(ticket -> address.equals(ticket.getCinemaAddress()))
                .collect(java.util.stream.Collectors.toList());
    }

    // Helper methods
    private String generateTicketPDF(Ticket ticket) {
        StringBuilder pdf = new StringBuilder();
        pdf.append("=== MOVIE TICKETS ===\n");
        pdf.append("Ticket code: ").append(ticket.getTicketNumber()).append("\n");
        pdf.append("Movie: ").append(ticket.getMovieTitle()).append("\n");
        pdf.append("Cinema: ").append(ticket.getCinemaName()).append("\n");
        if (ticket.getCinemaAddress() != null && !ticket.getCinemaAddress().isEmpty()) {
            pdf.append("Address: ").append(ticket.getCinemaAddress()).append("\n");
        }
        pdf.append("Day: ").append(ticket.getShowDate()).append("\n");
        pdf.append("Hour: ").append(ticket.getShowTime()).append("\n");
        pdf.append("Seat: ").append(ticket.getSeatNumber()).append("\n");
        pdf.append("Price: ").append(ticket.getPrice()).append(" VND\n");
        pdf.append("Trạng thái: ").append(ticket.getStatus()).append("\n");
        pdf.append("Payment method: ").append(ticket.getPaymentMethod() != null ? ticket.getPaymentMethod() : "N/A").append("\n");
        pdf.append("QR Code: ").append(ticket.getQrCode()).append("\n");
        if (ticket.getCancelledAt() != null) {
            pdf.append("Cancelled at: ").append(ticket.getCancelledAt()).append("\n");
            pdf.append("Reason for cancellation: ").append(ticket.getCancellationReason()).append("\n");
        }
        if (ticket.getUsedAt() != null) {
            pdf.append("Use at: ").append(ticket.getUsedAt()).append("\n");
        }
        if (ticket.getRefundedAt() != null) {
            pdf.append("Refund at: ").append(ticket.getRefundedAt()).append("\n");
            pdf.append("Refund amount: ").append(ticket.getRefundAmount()).append(" VND\n");
            pdf.append("Reason for refund: ").append(ticket.getRefundReason()).append("\n");
        }
        return pdf.toString();
    }

    private byte[] generateExcelExport(List<Ticket> tickets) {
        StringBuilder csv = new StringBuilder();
        csv.append("Ticket code,Movie name,Cinema,Cinema address,Show date,Show time,Seat,Price,Status,Payment method,Cancellation time,Cancellation reason,Validity time,Refund time,Refund amount,Refund reason\n");
        for (Ticket ticket : tickets) {
            csv.append(ticket.getTicketNumber()).append(",");
            csv.append(ticket.getMovieTitle()).append(",");
            csv.append(ticket.getCinemaName()).append(",");
            csv.append(ticket.getCinemaAddress() != null ? ticket.getCinemaAddress() : "").append(",");
            csv.append(ticket.getShowDate()).append(",");
            csv.append(ticket.getShowTime()).append(",");
            csv.append(ticket.getSeatNumber()).append(",");
            csv.append(ticket.getPrice()).append(",");
            csv.append(ticket.getStatus()).append(",");
            csv.append(ticket.getPaymentMethod() != null ? ticket.getPaymentMethod() : "").append(",");
            csv.append(ticket.getCancelledAt() != null ? ticket.getCancelledAt().toString() : "").append(",");
            csv.append(ticket.getCancellationReason() != null ? ticket.getCancellationReason() : "").append(",");
            csv.append(ticket.getUsedAt() != null ? ticket.getUsedAt().toString() : "").append(",");
            csv.append(ticket.getRefundedAt() != null ? ticket.getRefundedAt().toString() : "").append(",");
            csv.append(ticket.getRefundAmount()).append(",");
            csv.append(ticket.getRefundReason() != null ? ticket.getRefundReason() : "").append("\n");
        }
        return csv.toString().getBytes();
    }

    private byte[] generatePDFExport(List<Ticket> tickets) {
        StringBuilder pdf = new StringBuilder();
        pdf.append("=== Movie Ticket Lists ===\n\n");
        for (Ticket ticket : tickets) {
            pdf.append("Ticket code: ").append(ticket.getTicketNumber()).append("\n");
            pdf.append("Movie: ").append(ticket.getMovieTitle()).append("\n");
            pdf.append("Cinema: ").append(ticket.getCinemaName()).append("\n");
            if (ticket.getCinemaAddress() != null && !ticket.getCinemaAddress().isEmpty()) {
                pdf.append("Address: ").append(ticket.getCinemaAddress()).append("\n");
            }
            pdf.append("Day: ").append(ticket.getShowDate()).append(" - ").append(ticket.getShowTime()).append("\n");
            pdf.append("Seat: ").append(ticket.getSeatNumber()).append("\n");
            pdf.append("Price: ").append(ticket.getPrice()).append(" VND\n");
            pdf.append("Status: ").append(ticket.getStatus()).append("\n");
            pdf.append("Payment Method: ").append(ticket.getPaymentMethod() != null ? ticket.getPaymentMethod() : "N/A").append("\n");
            if (ticket.getCancelledAt() != null) {
                pdf.append("Cancelled at: ").append(ticket.getCancelledAt()).append(" - ").append(ticket.getCancellationReason()).append("\n");
            }
            if (ticket.getUsedAt() != null) {
                pdf.append("Use at: ").append(ticket.getUsedAt()).append("\n");
            }
            if (ticket.getRefundedAt() != null) {
                pdf.append("Refund at: ").append(ticket.getRefundedAt()).append(" - ").append(ticket.getRefundAmount()).append(" VND - ").append(ticket.getRefundReason()).append("\n");
            }
            pdf.append("---\n\n");
        }
        return pdf.toString().getBytes();
    }

    // Approve a ticket (for admin)
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveTicket(@PathVariable String id) {
        try {
            Optional<Ticket> ticketOpt = ticketRepository.findById(id);
            if (!ticketOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Ticket ticket = ticketOpt.get();
            if (!"pending".equals(ticket.getStatus())) {
                return ResponseEntity.badRequest().body("Just pending tickets can be approved");
            }

            String paymentMethod = ticket.getPaymentMethod();
            boolean isDigitalWallet = paymentMethod != null && 
                                    (paymentMethod.equalsIgnoreCase("momo") || 
                                     paymentMethod.equalsIgnoreCase("zalopay"));
            
            if (isDigitalWallet) {
                ticket.setStatus("pending");
            } else {
                ticket.setStatus("confirmed");
            }
            
            ticket.setPaymentStatus("paid");
            Ticket updatedTicket = ticketRepository.save(ticket);
            try {
                Notification notification = new Notification();
                notification.setUserId(ticket.getUserId());
                notification.setTitle("Ticket Approved");
                notification.setMessage("Ticket " + (ticket.getTicketNumber() != null ? ticket.getTicketNumber() : ticket.getId()) +
                    " for movie \"" + ticket.getMovieTitle() + "\" has been approved by admin and ready to use.");
                notification.setType("ticket_approved");
                notification.setRelatedType("ticket");
                notification.setIsRead(false);
                notification.setCreatedAt(LocalDateTime.now());
                
                notificationRepository.save(notification);
                System.out.println("Notification created for ticket approval: " + ticket.getId());
            } catch (Exception notificationError) {
                System.err.println("Error creating notification: " + notificationError.getMessage());
            }
            
            return ResponseEntity.ok(updatedTicket);
        } catch (Exception e) {
            System.err.println("Error approving ticket: " + e.getMessage());
            return ResponseEntity.badRequest().body("Error approving ticket: " + e.getMessage());
        }
    }
}