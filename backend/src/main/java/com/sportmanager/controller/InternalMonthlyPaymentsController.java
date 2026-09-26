package com.sportmanager.controller;

import com.sportmanager.dto.response.GenerateMonthlyPaymentsResponse;
import com.sportmanager.security.CronSecretVerifier;
import com.sportmanager.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/internal")
@RequiredArgsConstructor
@Slf4j
public class InternalMonthlyPaymentsController {

    private final PaymentService paymentService;
    private final CronSecretVerifier cronSecretVerifier;

    @PostMapping("/monthly-payments")
    public ResponseEntity<GenerateMonthlyPaymentsResponse> runMonthlyPayments(
            @RequestHeader(value = "X-Cron-Secret", required = false) String cronSecret
    ) {
        if (!cronSecretVerifier.matches(cronSecret)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        GenerateMonthlyPaymentsResponse result =
                paymentService.generateCurrentMonthPaymentsForCoveringSeasons();
        log.info(
                "Internal monthly payment job finished: created={}, skipped={}",
                result.getCreatedCount(),
                result.getSkippedCount()
        );
        return ResponseEntity.ok(result);
    }
}
