package com.example.demo.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.demo.model.CreateMoMoResponse;
import com.example.demo.model.MoMoOrder;
import com.example.demo.model.QueryMoMoResponse;
import com.example.demo.repository.MoMoOrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MoMoService {
	private final MoMoOrderRepository repo;

	// Helper method to build MoMo payment URL 
	@SuppressWarnings("unused")
	private String buildPayUrl(String orderId, long amount, String description) {
		return "";
	}
	private String buildQrUrl(String orderId, long amount, String description) {
		try {
			String bankBin = "970422"; 
			String accountNo = "0932082976"; 
			String template = "compact2";
			String amountStr = String.valueOf(amount);
			String addInfo = description != null ? description.substring(0, Math.min(description.length(), 25)) : orderId;
			
			// Use VietQR API to generate QR code
			String encodedAddInfo = URLEncoder.encode(addInfo, StandardCharsets.UTF_8);
			String qrUrl = String.format("https://img.vietqr.io/image/%s-%s-%s.png?amount=%s&addInfo=%s",
				bankBin, accountNo, template, amountStr, encodedAddInfo);
			
			return qrUrl;
		} catch (Exception e) {
			String paymentInfo = String.format("MoMo Payment\nOrder: %s\nAmount: %d VND\nNote: %s", 
				orderId, amount, description);
			String encoded = URLEncoder.encode(paymentInfo, StandardCharsets.UTF_8);
			return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encoded;
		}
	}

	public CreateMoMoResponse createOrder(String userLabel, long amount, String description) {
		String orderId = "MM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
		String payUrl = buildPayUrl(orderId, amount, description);
		String qrUrl = buildQrUrl(orderId, amount, description);

		MoMoOrder order = new MoMoOrder(
			null, orderId, userLabel, amount, description,
			"PENDING", payUrl, qrUrl, Instant.now(), Instant.now(), null
		);
		repo.save(order);
		return new CreateMoMoResponse(orderId, payUrl, qrUrl);
	}

	public QueryMoMoResponse queryOrder(String orderId) {
		MoMoOrder order = repo.findByOrderId(orderId)
			.orElseThrow(() -> new IllegalArgumentException("Order not found"));
		return new QueryMoMoResponse(order.getStatus());
	}

	public void markPaid(String orderId) {
		MoMoOrder order = repo.findByOrderId(orderId)
			.orElseThrow(() -> new IllegalArgumentException("Order not found"));
		order.setStatus("PAID");
		order.setPaidAt(Instant.now());
		order.setUpdatedAt(Instant.now());
		repo.save(order);
	}

	public void markExpired(String orderId) {
		MoMoOrder order = repo.findByOrderId(orderId)
			.orElseThrow(() -> new IllegalArgumentException("Order not found"));
		order.setStatus("EXPIRED");
		order.setUpdatedAt(Instant.now());
		repo.save(order);
	}

	public java.util.List<MoMoOrder> getAllOrders() {
		return repo.findAll();
	}
}
