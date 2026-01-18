package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.CreateMoMoResponse;
import com.example.demo.model.QueryMoMoResponse;
import com.example.demo.service.MoMoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/momo")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MoMoController {

	private final MoMoService moMoService;

	// Create a new MoMo order
	@PostMapping("/create")
	public ResponseEntity<CreateMoMoResponse> create(
		@RequestParam String user,
		@RequestParam long amount,
		@RequestParam String description
	) {
		return ResponseEntity.ok(moMoService.createOrder(user, amount, description));
	}

	// Query MoMo order status
	@GetMapping("/query/{orderId}")
	public ResponseEntity<QueryMoMoResponse> query(@PathVariable String orderId) {
		return ResponseEntity.ok(moMoService.queryOrder(orderId));
	}

	// Mark MoMo order as paid
	@PostMapping("/mark-paid")
	public ResponseEntity<Void> markPaid(@RequestParam String orderId) {
		moMoService.markPaid(orderId);
		return ResponseEntity.ok().build();
	}

	// Mark MoMo order as expired
	@PostMapping("/mark-expired")
	public ResponseEntity<Void> markExpired(@RequestParam String orderId) {
		moMoService.markExpired(orderId);
		return ResponseEntity.ok().build();
	}

	// Get all MoMo orders
	@GetMapping("/orders")
	public ResponseEntity<java.util.List<com.example.demo.model.MoMoOrder>> getAllOrders() {
		return ResponseEntity.ok(moMoService.getAllOrders());
	}
}
