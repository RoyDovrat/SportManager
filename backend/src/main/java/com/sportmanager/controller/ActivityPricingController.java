package com.sportmanager.controller;

import com.sportmanager.dto.request.ActivityPricingRequest;
import com.sportmanager.service.ActivityPricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activity-pricing")
@RequiredArgsConstructor
public class ActivityPricingController {

    private final ActivityPricingService activityPricingService;

    @PostMapping
    public ResponseEntity<String> createActivityPricing(
            @Valid @RequestBody ActivityPricingRequest request
    ) {
        activityPricingService.createActivityPricing(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("Activity pricing created successfully");
    }
}
