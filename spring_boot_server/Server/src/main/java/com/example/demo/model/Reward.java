package com.example.demo.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "rewards")
public class Reward {
    @Id
    private Long id;
    private String type; 
    private String description;
    private Integer quantity; 
    private LocalDateTime expiredAt;
}