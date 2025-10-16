package com.example.demo.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.model.Cinema;
import com.example.demo.model.Movie;
import com.example.demo.model.Showtime;
import com.example.demo.repository.CinemaRepository;
import com.example.demo.repository.MovieRepository;
import com.example.demo.repository.ShowtimeRepository;

@Service
public class ShowtimeService {
    
    @Autowired
    private ShowtimeRepository showtimeRepository;
    
    @Autowired
    private MovieRepository movieRepository;
    
    @Autowired
    private CinemaRepository cinemaRepository;
    
    // Create a new showtime validating movie 
    @Transactional
    @SuppressWarnings("UseSpecificCatch")
    public Showtime createShowtime(Showtime showtime) {
        try {
            Optional<Movie> movieOpt = movieRepository.findById(showtime.getMovieId());
            if (!movieOpt.isPresent()) {
                throw new RuntimeException("Movie not exists");
            }

            Optional<Cinema> cinemaOpt = cinemaRepository.findById(showtime.getCinemaId());
            if (!cinemaOpt.isPresent()) {
                throw new RuntimeException("Cinema not exists");
            }
            
            Movie movie = movieOpt.get();
            Cinema cinema = cinemaOpt.get();
            
            if (!cinema.hasMovie(showtime.getMovieId())) {
                throw new RuntimeException("mOvie not exists in cinema");
            }

            showtime.setMovieName(getMovieTitle(movie));
            showtime.setCinemaName(cinema.getName());
            showtime.setCinemaAddress(cinema.getAddress());

            if (showtime.getTotalSeats() <= 0) {
                showtime.setTotalSeats(100);
            }
            if (showtime.getAvailableSeats() <= 0) {
                showtime.setAvailableSeats(showtime.getTotalSeats());
            }
            if (showtime.getPrice() <= 0) {
                showtime.setPrice(80000);
            }
            if (showtime.getRoom() == null || showtime.getRoom().trim().isEmpty()) {
                showtime.setRoom("Room 1");
            }
            
            return showtimeRepository.save(showtime);
        } catch (Exception e) {
            throw new RuntimeException("Error when create showtime: " + e.getMessage());
        }
    }
    
    public List<Showtime> getShowtimesByCinemaAndMovie(String cinemaId, String movieId) {
        try {
            List<Showtime> showtimes = showtimeRepository.findByCinemaIdAndMovieId(cinemaId, movieId);
            
            // Populate movie and cinema info
            for (Showtime showtime : showtimes) {
                populateShowtimeInfo(showtime);
            }
            
            return showtimes;
        } catch (Exception e) {
            throw new RuntimeException("Error to get showtime: " + e.getMessage());
        }
    }

    public List<Showtime> getShowtimesByCinema(String cinemaId) {
        try {
            List<Showtime> showtimes = showtimeRepository.findByCinemaId(cinemaId);
            
            for (Showtime showtime : showtimes) {
                populateShowtimeInfo(showtime);
            }
            
            return showtimes;
        } catch (Exception e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }
    

    public List<Showtime> getShowtimesByMovie(String movieId) {
        try {
            List<Showtime> showtimes = showtimeRepository.findByMovieId(movieId);
            
            for (Showtime showtime : showtimes) {
                populateShowtimeInfo(showtime);
            }
            
            return showtimes;
        } catch (Exception e) {
            throw new RuntimeException("Error when getting movie showtimes: " + e.getMessage());
        }
    }
    

    public List<Showtime> getShowtimesByDateAndCinema(String cinemaId, String date) {
        try {
            LocalDateTime startOfDay = LocalDateTime.parse(date + "T00:00:00");
            LocalDateTime endOfDay = startOfDay.plusDays(1);
            
            List<Showtime> showtimes = showtimeRepository.findByCinemaId(cinemaId);

            List<Showtime> filteredShowtimes = showtimes.stream()
                .filter(showtime -> {
                    LocalDateTime showtimeDate = showtime.getStartTime();
                    return showtimeDate != null && showtimeDate.isAfter(startOfDay) && showtimeDate.isBefore(endOfDay);
                })
                .toList();
            
            for (Showtime showtime : filteredShowtimes) {
                populateShowtimeInfo(showtime);
            }
            
            return filteredShowtimes;
        } catch (Exception e) {
            throw new RuntimeException("Error when getting showtime by date: " + e.getMessage());
        }
    }

    @Transactional
    @SuppressWarnings("UseSpecificCatch")
    public Showtime updateShowtime(String showtimeId, Showtime updatedShowtime) {
        try {
            Optional<Showtime> existingOpt = showtimeRepository.findById(showtimeId);
            if (!existingOpt.isPresent()) {
                throw new RuntimeException("Showtime not exists");
            }
            
            Showtime existing = existingOpt.get();
            
            // Update fields
            if (updatedShowtime.getStartTime() != null) {
                existing.setStartTime(updatedShowtime.getStartTime());
            }
            if (updatedShowtime.getRoom() != null) {
                existing.setRoom(updatedShowtime.getRoom());
            }
            if (updatedShowtime.getTotalSeats() > 0) {
                existing.setTotalSeats(updatedShowtime.getTotalSeats());
            }
            if (updatedShowtime.getAvailableSeats() >= 0) {
                existing.setAvailableSeats(updatedShowtime.getAvailableSeats());
            }
            if (updatedShowtime.getPrice() > 0) {
                existing.setPrice(updatedShowtime.getPrice());
            }
            
            return showtimeRepository.save(existing);
        } catch (Exception e) {
            throw new RuntimeException("Error updating showtimes: " + e.getMessage());
        }
    }
    
    // Delete showtime
    @Transactional
    @SuppressWarnings("UseSpecificCatch")
    public boolean deleteShowtime(String showtimeId) {
        try {
            if (!showtimeRepository.existsById(showtimeId)) {
                throw new RuntimeException("Showtime not exists");
            }
            
            showtimeRepository.deleteById(showtimeId);
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Error deleting showtime: " + e.getMessage());
        }
    }

    // Helper to populate movie and cinema info in showtime
    private void populateShowtimeInfo(Showtime showtime) {
        if (showtime.getMovieId() != null) {
            Optional<Movie> movieOpt = movieRepository.findById(showtime.getMovieId());
            if (movieOpt.isPresent()) {
                Movie movie = movieOpt.get();
                showtime.setMovieName(getMovieTitle(movie));
            }
        }
        
        // Populate cinema info
        if (showtime.getCinemaId() != null) {
            Optional<Cinema> cinemaOpt = cinemaRepository.findById(showtime.getCinemaId());
            if (cinemaOpt.isPresent()) {
                Cinema cinema = cinemaOpt.get();
                showtime.setCinemaName(cinema.getName());
                showtime.setCinemaAddress(cinema.getAddress());
            }
        }
    }

    private String getMovieTitle(Movie movie) {
        if (movie.getTitle() != null && !movie.getTitle().trim().isEmpty()) {
            return movie.getTitle();
        }
        if (movie.getName() != null && !movie.getName().trim().isEmpty()) {
            return movie.getName();
        }
        if (movie.getMovieName() != null && !movie.getMovieName().trim().isEmpty()) {
            return movie.getMovieName();
        }
        if (movie.getEnglishTitle() != null && !movie.getEnglishTitle().trim().isEmpty()) {
            return movie.getEnglishTitle();
        }
        return "Unknown Movie";
    }
}
