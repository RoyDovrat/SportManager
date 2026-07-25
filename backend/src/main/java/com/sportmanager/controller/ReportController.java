package com.sportmanager.controller;

import com.sportmanager.dto.response.SeasonReportResponse;
import com.sportmanager.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public ResponseEntity<SeasonReportResponse> getSeasonSummary(
            @RequestParam Long seasonId
    ) {
        return ResponseEntity.ok(reportService.getSeasonReport(seasonId));
    }

    @GetMapping("/registrations")
    public ResponseEntity<SeasonReportResponse.RegistrationReportSection> getRegistrationReport(
            @RequestParam Long seasonId
    ) {
        return ResponseEntity.ok(reportService.getRegistrationReport(seasonId));
    }

    @GetMapping("/payments")
    public ResponseEntity<SeasonReportResponse.PaymentReportSection> getPaymentReport(
            @RequestParam Long seasonId
    ) {
        return ResponseEntity.ok(reportService.getPaymentReport(seasonId));
    }

    @GetMapping("/clothing")
    public ResponseEntity<SeasonReportResponse.ClothingReportSection> getClothingReport(
            @RequestParam Long seasonId
    ) {
        return ResponseEntity.ok(reportService.getClothingReport(seasonId));
    }
}
