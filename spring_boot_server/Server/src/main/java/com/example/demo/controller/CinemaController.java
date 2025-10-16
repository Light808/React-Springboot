package com.example.demo.controller;

import java.util.List;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Cinema;
import com.example.demo.repository.CinemaRepository;
import com.example.demo.service.MovieCinemaService;

@RestController
@RequestMapping("/api/cinemas")
@CrossOrigin(origins = "*")
public class CinemaController {
    
    @Autowired
    private CinemaRepository cinemaRepository;
    
    @Autowired
    private MovieCinemaService movieCinemaService;
    
    @GetMapping
    public List<Cinema> getAllCinemas() {
        List<Cinema> cinemas = cinemaRepository.findAll();
        for (Cinema cinema : cinemas) {
            if (cinema.getMovieIds() == null) {
                cinema.setMovieIds(new java.util.ArrayList<>());
            }
        }
        return cinemas;
    }

    // Get cinema by ID
    @GetMapping("/{id}")
    public Optional<Cinema> getCinemaById(@PathVariable String id) {
        return cinemaRepository.findById(id);
    }
    
    // Search cinemas 
    @GetMapping("/search")
    public List<Cinema> searchCinemas(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String status) {
        
        if (name != null && city != null) {
            return cinemaRepository.findByNameContainingIgnoreCaseAndCity(name, city);
        } else if (name != null) {
            return cinemaRepository.findByNameContainingIgnoreCase(name);
        } else if (city != null) {
            return cinemaRepository.findByCity(city);
        } else if (status != null) {
            return cinemaRepository.findByStatus(status);
        } else {
            return cinemaRepository.findAll();
        }
    }
    
    // Get active cinemas 
    @GetMapping("/active")
    public List<Cinema> getActiveCinemas() {
        return cinemaRepository.findByStatusOrderByNameAsc("Selling Tickets");
    }
    
    // Get cinemas by movie ID
    @GetMapping("/movie/{movieId}")
    public List<Cinema> getCinemasByMovie(@PathVariable String movieId) {
        return cinemaRepository.findByMovieIdsContaining(movieId);
    }
    
    // Create a new cinema
    @PostMapping
    public Cinema createCinema(@RequestBody Cinema cinema) {
        if (cinema.getStatus() == null || cinema.getStatus().trim().isEmpty()) {
            cinema.setStatus("Selling Tickets");
        }
        if (cinema.getFacilities() == null) {
            cinema.setFacilities(new java.util.ArrayList<>());
        }
        if (cinema.getMovieIds() == null) {
            cinema.setMovieIds(new java.util.ArrayList<>());
        }
        
        return cinemaRepository.save(cinema);
    }
    
    // Update an existing cinema
    @PutMapping("/{id}")
    public Cinema updateCinema(@PathVariable String id, @RequestBody Cinema cinema) {
        cinema.setId(id);
        return cinemaRepository.save(cinema);
    }
    
    // Delete a cinema
    @DeleteMapping("/{id}")
    public void deleteCinema(@PathVariable String id) {
        cinemaRepository.deleteById(id);
    }
    
    // Add or remove a movie from a cinema
    @PostMapping("/{cinemaId}/movies/{movieId}")
    public Cinema addMovieToCinema(@PathVariable String cinemaId, @PathVariable String movieId) {
        try {
            boolean success = movieCinemaService.addMovieToCinema(movieId, cinemaId);
            if (success) {
                Optional<Cinema> cinemaOpt = cinemaRepository.findById(cinemaId);
                if (cinemaOpt.isPresent()) {
                    return cinemaOpt.get();
                }
            }
            return null;
        } catch (Exception e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
    
    // Remove a movie from a cinema
    @DeleteMapping("/{cinemaId}/movies/{movieId}")
    public Cinema removeMovieFromCinema(@PathVariable String cinemaId, @PathVariable String movieId) {
        try {
            boolean success = movieCinemaService.removeMovieFromCinema(movieId, cinemaId);
            if (success) {
                Optional<Cinema> cinemaOpt = cinemaRepository.findById(cinemaId);
                if (cinemaOpt.isPresent()) {
                    return cinemaOpt.get();
                }
            }
            return null;
        } catch (Exception e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
    
    // Get movie counts for each cinema
    @GetMapping("/movie-counts")
    public java.util.Map<String, Integer> getCinemaMovieCounts() {
        try {
            List<Cinema> cinemas = cinemaRepository.findAll();
            java.util.Map<String, Integer> movieCounts = new java.util.HashMap<>();
            
            for (Cinema cinema : cinemas) {
                int count = cinema.getMovieIds() != null ? cinema.getMovieIds().size() : 0;
                movieCounts.put(cinema.getId(), count);
            }
            
            return movieCounts;
        } catch (Exception e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
}