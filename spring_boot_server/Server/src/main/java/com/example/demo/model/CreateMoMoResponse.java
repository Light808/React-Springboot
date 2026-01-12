package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateMoMoResponse {
	private String orderId;
	private String payUrl;
	private String qrUrl;
}
