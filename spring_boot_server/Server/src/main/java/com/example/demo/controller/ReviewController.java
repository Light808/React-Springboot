package com.example.demo.controller;

import java.time.LocalDateTime;
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
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.Review;
import com.example.demo.model.User;
import com.example.demo.repository.ReviewRepository;
import com.example.demo.repository.UserRepository;

@SuppressWarnings("unused")
@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all reviews
    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews() {
        try {
            List<Review> reviews = reviewRepository.findByIsActiveTrueOrderByCreatedAtDesc();
            enrichReviewsWithUserAvatar(reviews);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get review by ID
    @GetMapping("/{id}")
    public ResponseEntity<Review> getReviewById(@PathVariable String id) {
        try {
            Optional<Review> review = reviewRepository.findById(id);
            if (review.isPresent()) {
                Review r = review.get();
                enrichReviewsWithUserAvatar(java.util.Collections.singletonList(r));
                return ResponseEntity.ok(r);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get reviews by movie ID
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<Review>> getReviewsByMovieId(@PathVariable String movieId) {
        try {
            List<Review> reviews = reviewRepository.findByMovieIdAndIsActiveTrueOrderByCreatedAtDesc(movieId);
            enrichReviewsWithUserAvatar(reviews);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /** Fill userAvatar from User when review has userId but no userAvatar (e.g. old reviews). */
    private void enrichReviewsWithUserAvatar(List<Review> reviews) {
        if (reviews == null) return;
        for (Review r : reviews) {
            if ((r.getUserAvatar() == null || r.getUserAvatar().trim().isEmpty()) && r.getUserId() != null && !r.getUserId().trim().isEmpty()) {
                userRepository.findById(r.getUserId()).ifPresent(user -> {
                    if (user.getAvatar() != null && !user.getAvatar().trim().isEmpty()) {
                        r.setUserAvatar(user.getAvatar());
                    }
                });
            }
        }
    }

    // Get reviews by user ID
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getReviewsByUserId(@PathVariable String userId) {
        try {
            List<Review> reviews = reviewRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);
            enrichReviewsWithUserAvatar(reviews);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get reviews by movie ID and rating
    @GetMapping("/movie/{movieId}/rating/{rating}")
    public ResponseEntity<List<Review>> getReviewsByMovieIdAndRating(@PathVariable String movieId, @PathVariable Integer rating) {
        try {
            List<Review> reviews = reviewRepository.findByMovieIdAndRatingAndIsActiveTrue(movieId, rating);
            enrichReviewsWithUserAvatar(reviews);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get review count by movie ID
    @GetMapping("/movie/{movieId}/count")
    public ResponseEntity<Long> getReviewCountByMovieId(@PathVariable String movieId) {
        try {
            long count = reviewRepository.countByMovieIdAndIsActiveTrue(movieId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get review count by movie ID and rating
    @GetMapping("/movie/{movieId}/rating/{rating}/count")
    public ResponseEntity<Long> getReviewCountByMovieIdAndRating(@PathVariable String movieId, @PathVariable Integer rating) {
        try {
            long count = reviewRepository.countByMovieIdAndRatingAndIsActiveTrue(movieId, rating);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Create a new review
    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review review) {
        try {
            if (review.getMovieId() == null || review.getMovieId().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (review.getUserId() == null || review.getUserId().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (review.getUserName() == null || review.getUserName().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (review.getRating() == null || review.getRating() < 1 || review.getRating() > 5) {
                return ResponseEntity.badRequest().build();
            }
            if (review.getComment() == null || review.getComment().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }

            if (review.getLikes() == null) {
                review.setLikes(0);
            }
            if (review.getDislikes() == null) {
                review.setDislikes(0);
            }
            if (review.getIsActive() == null) {
                review.setIsActive(true);
            }
            if (review.getIsVerified() == null) {
                review.setIsVerified(false);
            }

            // Use profile avatar when not provided
            if (review.getUserAvatar() == null || review.getUserAvatar().trim().isEmpty()) {
                userRepository.findById(review.getUserId()).ifPresent(user -> {
                    if (user.getAvatar() != null && !user.getAvatar().trim().isEmpty()) {
                        review.setUserAvatar(user.getAvatar());
                    }
                });
            }

            LocalDateTime now = LocalDateTime.now();
            review.setCreatedAt(now);
            review.setUpdatedAt(now);

            Review savedReview = reviewRepository.save(review);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedReview);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // update a review
    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(@PathVariable String id, @RequestBody Review review) {
        try {
            if (!reviewRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            if (review.getRating() != null && (review.getRating() < 1 || review.getRating() > 5)) {
                return ResponseEntity.badRequest().build();
            }

            review.setId(id);
            review.setUpdatedAt(LocalDateTime.now());

            Review updatedReview = reviewRepository.save(review);
            return ResponseEntity.ok(updatedReview);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // like a review
    @PutMapping("/{id}/like")
    public ResponseEntity<Review> likeReview(@PathVariable String id) {
        try {
            Optional<Review> reviewOpt = reviewRepository.findById(id);
            if (reviewOpt.isPresent()) {
                Review review = reviewOpt.get();
                review.setLikes(review.getLikes() + 1);
                review.setUpdatedAt(LocalDateTime.now());
                Review updatedReview = reviewRepository.save(review);
                return ResponseEntity.ok(updatedReview);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // dislike a review
    @PutMapping("/{id}/dislike")
    public ResponseEntity<Review> dislikeReview(@PathVariable String id) {
        try {
            Optional<Review> reviewOpt = reviewRepository.findById(id);
            if (reviewOpt.isPresent()) {
                Review review = reviewOpt.get();
                review.setDislikes(review.getDislikes() + 1);
                review.setUpdatedAt(LocalDateTime.now());
                Review updatedReview = reviewRepository.save(review);
                return ResponseEntity.ok(updatedReview);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Delete a review by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable String id) {
        try {
            if (!reviewRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            reviewRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
