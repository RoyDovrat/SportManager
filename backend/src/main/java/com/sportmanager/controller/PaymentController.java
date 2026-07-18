package com.sportmanager.controller;

import com.sportmanager.dto.request.ClothingPaymentRequest;
import com.sportmanager.dto.request.MonthlyPaymentRequest;
import com.sportmanager.entity.Payment;
import com.sportmanager.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/monthly")
    public ResponseEntity<Payment> createMonthlyPayment(
            @Valid
            @RequestBody MonthlyPaymentRequest request
    ) {
        Payment payment = paymentService.createMonthlyPayment(request);

        return ResponseEntity.ok(payment);
    }

    @PostMapping("/clothing")
    public ResponseEntity<Payment> createClothingPayment(
            @Valid
            @RequestBody ClothingPaymentRequest request
    ) {
        Payment payment = paymentService.createClothingPayment(request);

        return ResponseEntity.ok(payment);
    }
}