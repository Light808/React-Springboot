package com.example.demo.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.model.PaymentOrder;

public interface PaymentOrderRepository extends MongoRepository<PaymentOrder, String> {
}