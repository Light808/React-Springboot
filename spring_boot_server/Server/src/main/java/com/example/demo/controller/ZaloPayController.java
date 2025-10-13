package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.CreateZaloPayResponse;
import com.example.demo.model.QueryZaloPayResponse;
import com.example.demo.service.ZaloPayService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/zalopay")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ZaloPayController {

	private final ZaloPayService zaloPayService;

	@PostMapping("/create")
	public ResponseEntity<CreateZaloPayResponse> create(
		@RequestParam String user,
		@RequestParam long amount,
		@RequestParam String description
	) {
		return ResponseEntity.ok(zaloPayService.createOrder(user, amount, description));
	}

	@GetMapping("/query/{appTransId}")
	public ResponseEntity<QueryZaloPayResponse> query(@PathVariable String appTransId) {
		return ResponseEntity.ok(zaloPayService.queryOrder(appTransId));
	}

	@PostMapping("/mark-paid")
	public ResponseEntity<Void> markPaid(@RequestParam String appTransId) {
		zaloPayService.markPaid(appTransId);
		return ResponseEntity.ok().build();
	}

	@PostMapping("/mark-expired")
	public ResponseEntity<Void> markExpired(@RequestParam String appTransId) {
		zaloPayService.markExpired(appTransId);
		return ResponseEntity.ok().build();
	}
}