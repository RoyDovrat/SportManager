package com.sportmanager.controller;

import com.sportmanager.dto.request.ClothingPricingRequest;
import com.sportmanager.entity.ClothingPricing;
import com.sportmanager.service.ClothingPricingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clothing-pricing")
@RequiredArgsConstructor
public class ClothingPricingController {

    private final ClothingPricingService clothingPricingService;

    @PostMapping
    public ResponseEntity<ClothingPricing> createClothingPricing(@RequestBody ClothingPricingRequest request) {
        ClothingPricing clothingPricing = clothingPricingService.createClothingPricing(request);

        return ResponseEntity.ok(clothingPricing);
    }
}