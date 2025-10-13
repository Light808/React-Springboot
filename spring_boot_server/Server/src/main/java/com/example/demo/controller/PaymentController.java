package com.example.demo.controller;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.model.CreateOrderRequest;
import com.example.demo.model.CreateOrderResponse;
import com.example.demo.model.PaymentOrder;
import com.example.demo.model.VerifyResponse;
import com.example.demo.repository.PaymentOrderRepository;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

  private final PaymentOrderRepository repo;

  public PaymentController(PaymentOrderRepository repo) {
    this.repo = repo;
  }


  @PostMapping("/create-order")
  public CreateOrderResponse createOrder(@RequestBody CreateOrderRequest req) {
    String orderId = "local-" + UUID.randomUUID();
    PaymentOrder order = new PaymentOrder(
        orderId,
        req.getAmount(),
        req.getOrderInfo(),
        req.getMethod(),
        "pending",
        Instant.now(),
        req.getUserId(),
        req.getUserName(),
        req.getUserEmail()
    );
    repo.save(order);
    
    // Generate QR code URL and data
    String bankBin = "970407";
    String accountNo = "1221868856";
    String template = "compact";
    String amount = String.valueOf(order.getAmount());
    String addInfo = order.getOrderInfo() != null ? order.getOrderInfo() : order.getOrderId();

    String qrUrl = "https://img.vietqr.io/image/" + bankBin + "-" + accountNo + "-" + template
      + ".png?amount=" + amount + "&addInfo=" + urlEncode(addInfo);

    String qrData = "VietQR|" + bankBin + "|" + accountNo + "|" + amount + "|" + addInfo + "|" + order.getOrderId();

    return new CreateOrderResponse(order.getOrderId(), order.getStatus(), qrUrl, qrData);
  }

  @GetMapping("/verify")
  public VerifyResponse verify(@RequestParam String orderId) {
    return repo.findById(orderId)
      .map(o -> new VerifyResponse(o.getOrderId(), o.getStatus()))
      .orElseGet(() -> new VerifyResponse(orderId, "failed"));
  }

  // For admin/webhook to confirm payment
  @PostMapping("/mark-paid")
  public VerifyResponse markPaid(@RequestParam String orderId) {
    return repo.findById(orderId).map(o -> {
      o.setStatus("paid");
      repo.save(o);
      return new VerifyResponse(o.getOrderId(), o.getStatus());
    }).orElseGet(() -> new VerifyResponse(orderId, "failed"));
  }

  @PostMapping("/mark-expired")
  public VerifyResponse markExpired(@RequestParam String orderId) {
    return repo.findById(orderId).map(o -> {
      o.setStatus("expired");
      repo.save(o);
      return new VerifyResponse(o.getOrderId(), o.getStatus());
    }).orElseGet(() -> new VerifyResponse(orderId, "failed"));
  }

  @GetMapping("/orders")
public ResponseEntity<List<PaymentOrder>> getAllOrders() {
    try {
        List<PaymentOrder> orders = repo.findAll();
        return ResponseEntity.ok(orders);
    } catch (Exception e) {
        return ResponseEntity.status(500).body(new ArrayList<>());
    }
}

  private String urlEncode(String s) {
    return URLEncoder.encode(s, StandardCharsets.UTF_8);
  }
}