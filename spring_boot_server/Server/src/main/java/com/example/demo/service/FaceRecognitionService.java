package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class FaceRecognitionService {
    
    // Calculate cosine similarity between two face descriptors
    // Returns a value between 0 and 1, where 1 means identical faces
    public double calculateSimilarity(List<Double> descriptor1, List<Double> descriptor2) {
        if (descriptor1 == null || descriptor2 == null) {
            return 0.0;
        }
        
        if (descriptor1.size() != descriptor2.size()) {
            return 0.0;
        }
        
        // Calculate dot product
        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;
        
        for (int i = 0; i < descriptor1.size(); i++) {
            double val1 = descriptor1.get(i);
            double val2 = descriptor2.get(i);
            dotProduct += val1 * val2;
            norm1 += val1 * val1;
            norm2 += val2 * val2;
        }
        
        // Calculate cosine similarity
        double denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        if (denominator == 0.0) {
            return 0.0;
        }
        
        return dotProduct / denominator;
    }

    // Normalize descriptor to unit vector
    private List<Double> normalizeDescriptor(List<Double> descriptor) {
        double norm = 0.0;
        for (Double val : descriptor) {
            norm += val * val;
        }
        norm = Math.sqrt(norm);
        
        if (norm == 0.0) {
            return descriptor;
        }
        
        List<Double> normalized = new java.util.ArrayList<>();
        for (Double val : descriptor) {
            normalized.add(val / norm);
        }
        return normalized;
    }
    
    public boolean isMatch(List<Double> descriptor1, List<Double> descriptor2) {
        List<Double> norm1 = normalizeDescriptor(descriptor1);
        List<Double> norm2 = normalizeDescriptor(descriptor2);
        
        double similarity = calculateSimilarity(norm1, norm2);
        return similarity > 0.0;
    }
    
    // Get similarity score for debugging
    public double getSimilarityScore(List<Double> descriptor1, List<Double> descriptor2) {
        return calculateSimilarity(descriptor1, descriptor2);
    }
}
