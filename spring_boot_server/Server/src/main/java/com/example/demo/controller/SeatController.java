package com.example.demo.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Seat;
import com.example.demo.repository.SeatRepository;

@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*")
public class SeatController {
    @Autowired
    private SeatRepository seatRepository;

    @GetMapping
    public List<Seat> getAllSeats() {
        return seatRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Seat> getSeatById(@PathVariable String id) {
        return seatRepository.findById(id);
    }

    // Get seats by showtime ID
    @GetMapping("/showtime/{showtimeId}")
    public List<Seat> getSeatsByShowtime(@PathVariable String showtimeId) {
        return seatRepository.findByShowtimeId(showtimeId);
    }

    @PostMapping
    public Seat createSeat(@RequestBody Seat seat) {
        return seatRepository.save(seat);
    }

    // Create multiple seats
    @PostMapping("/batch")
    public List<Seat> createMultipleSeats(@RequestBody List<Seat> seats) {
        return seatRepository.saveAll(seats);
    }

    // Update seat details
    @PutMapping("/{id}")
    public Seat updateSeat(@PathVariable String id, @RequestBody Seat seat) {
        seat.setId(id);
        return seatRepository.save(seat);
    }

    // book a seat
    @PutMapping("/{id}/book")
    public Seat bookSeat(@PathVariable String id, @RequestBody Map<String, String> request) {
        Optional<Seat> seatOpt = seatRepository.findById(id);
        if (seatOpt.isPresent()) {
            Seat seat = seatOpt.get();

            if (seat.isBooked() && seat.getBookedBy() != null && !seat.getBookedBy().trim().isEmpty()) {
                throw new RuntimeException("Seat has already been booked");
            }
            
            String userId = request.get("userId");
            if (userId == null || userId.trim().isEmpty()) {
                throw new RuntimeException("UserId not provided");
            }
            
            seat.setBooked(true);
            seat.setBookedBy(userId);
            seat.setBookedAt(java.time.LocalDateTime.now().toString());
            return seatRepository.save(seat);
        }
        throw new RuntimeException("Not found seat");
    }

    // unbook a seat
    @PutMapping("/{id}/unbook")
    public Seat unbookSeat(@PathVariable String id, @RequestBody Map<String, String> request) {
        Optional<Seat> seatOpt = seatRepository.findById(id);
        if (seatOpt.isPresent()) {
            Seat seat = seatOpt.get();
            
            // Check if the user is the one who booked the seat
            String userId = request.get("userId");
            if (userId == null || userId.trim().isEmpty()) {
                throw new RuntimeException("UserId not provided");
            }
            
            if (!seat.isBooked() || seat.getBookedBy() == null || seat.getBookedBy().trim().isEmpty()) {
                throw new RuntimeException("Seat is not booked");
            }
            
            if (!userId.equals(seat.getBookedBy())) {
                throw new RuntimeException("You do not have the right to cancel this reservation.");
            }
            
            seat.setBooked(false);
            seat.setBookedBy(null);
            seat.setBookedAt(null);
            return seatRepository.save(seat);
        }
        throw new RuntimeException("Not found seat");
    }

    @DeleteMapping("/{id}")
    public void deleteSeat(@PathVariable String id) {
        seatRepository.deleteById(id);
    }

    // Delete seats by showtime ID
    @DeleteMapping("/showtime/{showtimeId}")
    public void deleteSeatsByShowtime(@PathVariable String showtimeId) {
        seatRepository.deleteByShowtimeId(showtimeId);
    }
}