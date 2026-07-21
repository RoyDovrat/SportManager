package com.sportmanager.controller;

import com.sportmanager.dto.request.ActivityPricingRequest;
import com.sportmanager.dto.request.ActivityPricingUpdateRequest;
import com.sportmanager.dto.response.ActivityPricingResponse;
import com.sportmanager.service.ActivityPricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity-pricing")
@RequiredArgsConstructor
public class ActivityPricingController {

    private final ActivityPricingService activityPricingService;

    @PostMapping
    public ResponseEntity<ActivityPricingResponse> createActivityPricing(
            @Valid @RequestBody ActivityPricingRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityPricingService.createActivityPricing(request));
    }

    @GetMapping("/{pricingId}")
    public ResponseEntity<ActivityPricingResponse> getActivityPricingById(
            @PathVariable Long pricingId
    ) {
        return ResponseEntity.ok(activityPricingService.getActivityPricingById(pricingId));
    }

    @GetMapping
    public ResponseEntity<List<ActivityPricingResponse>> getActivityPricingBySeason(
            @RequestParam Long seasonId
    ) {
        return ResponseEntity.ok(activityPricingService.getActivityPricingBySeason(seasonId));
    }

    @PutMapping("/{pricingId}")
    public ResponseEntity<ActivityPricingResponse> updateActivityPricing(
            @PathVariable Long pricingId,
            @Valid @RequestBody ActivityPricingUpdateRequest request
    ) {
        return ResponseEntity.ok(
                activityPricingService.updateActivityPricing(pricingId, request)
        );
    }
}
