package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CreateZaloPayResponse {
	private String appTransId;
	private String payUrl;
	private String qrUrl;
}
