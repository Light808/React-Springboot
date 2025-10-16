package com.example.demo.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.demo.model.CreateZaloPayResponse;
import com.example.demo.model.QueryZaloPayResponse;
import com.example.demo.model.ZaloPayOrder;
import com.example.demo.repository.ZaloPayOrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ZaloPayService {
	private final ZaloPayOrderRepository repo;

	// Helper methods to build URLs
	private String buildPayUrl(String appTransId, long amount, String description) {
		String desc = URLEncoder.encode(description, StandardCharsets.UTF_8);
		return "https://sbox.zalopay.vn/pay?app_trans_id=" + appTransId + "&amount=" + amount + "&desc=" + desc;
	}

	// Generate QR code URL from pay URL
	private String buildQrUrl(String payUrl) {
		String data = URLEncoder.encode(payUrl, StandardCharsets.UTF_8);
		return "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + data;
	}

	public CreateZaloPayResponse createOrder(String userLabel, long amount, String description) {
		String appTransId = "ZP-" + UUID.randomUUID();
		String payUrl = buildPayUrl(appTransId, amount, description);
		String qrUrl = buildQrUrl(payUrl);

		ZaloPayOrder order = new ZaloPayOrder(
			null, appTransId, userLabel, amount, description,
			"PENDING", payUrl, qrUrl, Instant.now(), Instant.now(), null
		);
		repo.save(order);
		return new CreateZaloPayResponse(appTransId, payUrl, qrUrl);
	}

	public QueryZaloPayResponse queryOrder(String appTransId) {
		ZaloPayOrder order = repo.findByAppTransId(appTransId)
			.orElseThrow(() -> new IllegalArgumentException("Order not found"));
		return new QueryZaloPayResponse(order.getStatus());
	}

	public void markPaid(String appTransId) {
		ZaloPayOrder order = repo.findByAppTransId(appTransId)
			.orElseThrow(() -> new IllegalArgumentException("Order not found"));
		order.setStatus("PAID");
		order.setPaidAt(Instant.now());
		order.setUpdatedAt(Instant.now());
		repo.save(order);
	}

	public void markExpired(String appTransId) {
		ZaloPayOrder order = repo.findByAppTransId(appTransId)
			.orElseThrow(() -> new IllegalArgumentException("Order not found"));
		order.setStatus("EXPIRED");
		order.setUpdatedAt(Instant.now());
		repo.save(order);
	}
}