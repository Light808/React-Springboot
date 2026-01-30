package com.example.demo.controller;

import java.util.List;
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

import com.example.demo.model.Movie;
import com.example.demo.model.Article;
import com.example.demo.repository.MovieRepository;
import com.example.demo.repository.ArticleRepository;
import com.example.demo.service.MovieCinemaService;

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = "*")
public class MovieController {
    @Autowired
    private MovieRepository movieRepository;
    
    @Autowired
    private MovieCinemaService movieCinemaService;
    
    @Autowired
    private ArticleRepository articleRepository;

    // Get all movies
    @GetMapping
    public ResponseEntity<List<Movie>> getAllMovies() {
        try {
            List<Movie> movies = movieRepository.findAll();
            return ResponseEntity.ok(movies);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get movie by ID
    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable String id) {
        try {
            Optional<Movie> movie = movieRepository.findById(id);
            if (movie.isPresent()) {
                return ResponseEntity.ok(movie.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    //Get movie by TMDB ID
    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        try {
            if (movie.getTitle() == null || movie.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            
            Movie savedMovie = movieRepository.save(movie);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMovie);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // update movie
    @PutMapping("/{id}")
    public ResponseEntity<Movie> updateMovie(@PathVariable String id, @RequestBody Movie movie) {
        try {
            if (!movieRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            movie.setId(id);
            Movie updatedMovie = movieRepository.save(movie);
            return ResponseEntity.ok(updatedMovie);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // delete movie
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable String id) {
        try {
            if (!movieRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            movieRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Search movies by title
    @GetMapping("/search")
    public ResponseEntity<List<Movie>> searchMoviesByTitle(@RequestParam String q) {
        try {
            List<Movie> allMovies = movieRepository.findAll();
            List<Movie> filteredMovies = allMovies.stream()
                .filter(movie -> {
                    String searchQuery = q.toLowerCase();
                    return (movie.getTitle() != null && movie.getTitle().toLowerCase().contains(searchQuery)) ||
                           (movie.getGenre() != null && movie.getGenre().toLowerCase().contains(searchQuery)) ||
                           (movie.getDirector() != null && movie.getDirector().toLowerCase().contains(searchQuery)) ||
                           (movie.getActors() != null && movie.getActors().toLowerCase().contains(searchQuery)) ||
                           (movie.getName() != null && movie.getName().toLowerCase().contains(searchQuery)) ||
                           (movie.getMovieName() != null && movie.getMovieName().toLowerCase().contains(searchQuery));
                })
                .toList();
            return ResponseEntity.ok(filteredMovies);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get movies by genre
    @GetMapping("/genre/{genre}")
    public ResponseEntity<List<Movie>> getMoviesByGenre(@PathVariable String genre) {
        try {
            List<Movie> allMovies = movieRepository.findAll();
            List<Movie> filteredMovies = allMovies.stream()
                .filter(movie -> {
                    if (movie.getGenres() != null) {
                        for (String g : movie.getGenres()) {
                            if (g != null && g.toLowerCase().contains(genre.toLowerCase())) {
                                return true;
                            }
                        }
                    }
                    return movie.getGenre() != null &&
                           movie.getGenre().toLowerCase().contains(genre.toLowerCase());
                })
                .toList();
            return ResponseEntity.ok(filteredMovies);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get featured movies
    @GetMapping("/featured")
    public ResponseEntity<List<Movie>> getFeaturedMovies(@RequestParam(defaultValue = "7.0") double minRating) {
        try {
            List<Movie> allMovies = movieRepository.findAll();
            List<Movie> featuredMovies = allMovies.stream()
                .filter(movie -> {
                    try {
                        if (movie.getRating() != null) {
                            double rating = Double.parseDouble(movie.getRating());
                            return rating >= minRating;
                        }
                        if (movie.getScore() != null) {
                            double score = Double.parseDouble(movie.getScore());
                            return score >= minRating;
                        }
                        if (movie.getVoteAverage() != null) {
                            double voteAvg = Double.parseDouble(movie.getVoteAverage());
                            return voteAvg >= minRating;
                        }
                        return false;
                    } catch (NumberFormatException e) {
                        return false;
                    }
                })
                .toList();
            return ResponseEntity.ok(featuredMovies);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get movies by release year
    @GetMapping("/year/{year}")
    public ResponseEntity<List<Movie>> getMoviesByYear(@PathVariable String year) {
        try {
            List<Movie> allMovies = movieRepository.findAll();
            List<Movie> filteredMovies = allMovies.stream()
                .filter(movie -> {
                    if (movie.getReleaseYear() != null && movie.getReleaseYear().equals(year)) {
                        return true;
                    }
                    if (movie.getYear() != null && movie.getYear().equals(year)) {
                        return true;
                    }
                    if (movie.getReleaseDate() != null && movie.getReleaseDate().contains(year)) {
                        return true;
                    }
                    return false;
                })
                .toList();
            return ResponseEntity.ok(filteredMovies);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Add movie to cinema
    @PostMapping("/{movieId}/cinemas/{cinemaId}")
    public ResponseEntity<Movie> addMovieToCinema(@PathVariable String movieId, @PathVariable String cinemaId) {
        try {
            boolean success = movieCinemaService.addMovieToCinema(movieId, cinemaId);
            if (success) {
                Optional<Movie> movieOpt = movieRepository.findById(movieId);
                if (movieOpt.isPresent()) {
                    return ResponseEntity.ok(movieOpt.get());
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Delete movie from cinema
    @DeleteMapping("/{movieId}/cinemas/{cinemaId}")
    public ResponseEntity<Movie> removeMovieFromCinema(@PathVariable String movieId, @PathVariable String cinemaId) {
        try {
            boolean success = movieCinemaService.removeMovieFromCinema(movieId, cinemaId);
            if (success) {
                Optional<Movie> movieOpt = movieRepository.findById(movieId);
                if (movieOpt.isPresent()) {
                    return ResponseEntity.ok(movieOpt.get());
                }
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get movies by cinema ID
    @GetMapping("/cinema/{cinemaId}")
    public ResponseEntity<List<Movie>> getMoviesByCinema(@PathVariable String cinemaId) {
        try {
            List<Movie> cinemaMovies = movieCinemaService.getMoviesByCinema(cinemaId);
            return ResponseEntity.ok(cinemaMovies);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get all articles for a movie
    @GetMapping("/{movieId}/articles")
    public ResponseEntity<List<Article>> getMovieArticles(@PathVariable String movieId) {
        try {
            if (!movieRepository.existsById(movieId)) {
                return ResponseEntity.notFound().build();
            }
            List<Article> articles = articleRepository.findByMovieId(movieId);
            return ResponseEntity.ok(articles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Add article to movie
    @PostMapping("/{movieId}/articles/{articleId}")
    public ResponseEntity<Article> addArticleToMovie(@PathVariable String movieId, @PathVariable String articleId) {
        try {
            Optional<Movie> movieOpt = movieRepository.findById(movieId);
            Optional<Article> articleOpt = articleRepository.findById(articleId);
            
            if (!movieOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            if (!articleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Article article = articleOpt.get();
            article.setMovieId(movieId);
            
            // Also add to movieIds list if it exists
            if (article.getMovieIds() == null) {
                article.setMovieIds(new java.util.ArrayList<>());
            }
            if (!article.getMovieIds().contains(movieId)) {
                article.getMovieIds().add(movieId);
            }
            
            Article updatedArticle = articleRepository.save(article);
            return ResponseEntity.ok(updatedArticle);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Remove article from movie
    @DeleteMapping("/{movieId}/articles/{articleId}")
    public ResponseEntity<Void> removeArticleFromMovie(@PathVariable String movieId, @PathVariable String articleId) {
        try {
            Optional<Article> articleOpt = articleRepository.findById(articleId);
            
            if (!articleOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Article article = articleOpt.get();
            
            // Remove movieId from article
            if (movieId.equals(article.getMovieId())) {
                article.setMovieId(null);
            }
            
            // Remove from movieIds list if it exists
            if (article.getMovieIds() != null) {
                article.getMovieIds().remove(movieId);
            }
            
            articleRepository.save(article);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
