package com.example.demo.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.example.demo.model.User;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameAndPassword(String username, String password);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByFacebookId(String facebookId);
    Optional<User> findByEmailAndProvider(String email, String provider);
    
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByGoogleId(String googleId);
    boolean existsByFacebookId(String facebookId);
}