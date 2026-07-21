package com.sportmanager.controller;

import com.sportmanager.dto.request.ClothingPaymentRequest;
import com.sportmanager.dto.request.ConfirmPaymentRequest;
import com.sportmanager.dto.request.GenerateMonthlyPaymentsRequest;
import com.sportmanager.dto.request.ManualPaymentRequest;
import com.sportmanager.dto.request.MonthlyPaymentRequest;
import com.sportmanager.dto.response.GenerateMonthlyPaymentsResponse;
import com.sportmanager.dto.response.PaymentResponse;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.PaymentType;
import com.sportmanager.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/monthly")
    public ResponseEntity<PaymentResponse> createMonthlyPayment(
            @Valid @RequestBody MonthlyPaymentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createMonthlyPayment(request));
    }

    @PostMapping("/monthly/generate")
    public ResponseEntity<GenerateMonthlyPaymentsResponse> generateMonthlyPayments(
            @Valid @RequestBody GenerateMonthlyPaymentsRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.generateMonthlyPayments(request));
    }

    @PostMapping("/clothing")
    public ResponseEntity<PaymentResponse> createClothingPayment(
            @Valid @RequestBody ClothingPaymentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createClothingPayment(request));
    }

    @PostMapping("/manual")
    public ResponseEntity<PaymentResponse> createManualPayment(
            @Valid @RequestBody ManualPaymentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createManualPayment(request));
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getPayments(
            @RequestParam(required = false) Long registrationId,
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) PaymentType paymentType,
            @RequestParam(required = false) LocalDate chargeMonth
    ) {
        return ResponseEntity.ok(
                paymentService.getPayments(registrationId, status, paymentType, chargeMonth)
        );
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable Long paymentId
    ) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    @PatchMapping("/{paymentId}/confirm")
    public ResponseEntity<PaymentResponse> confirmPayment(
            @PathVariable Long paymentId,
            @RequestBody(required = false) ConfirmPaymentRequest request
    ) {
        if (request == null) {
            request = new ConfirmPaymentRequest();
        }
        return ResponseEntity.ok(paymentService.confirmPayment(paymentId, request));
    }

    @PatchMapping("/{paymentId}/cancel")
    public ResponseEntity<PaymentResponse> cancelPayment(
            @PathVariable Long paymentId
    ) {
        return ResponseEntity.ok(paymentService.cancelPayment(paymentId));
    }
}
