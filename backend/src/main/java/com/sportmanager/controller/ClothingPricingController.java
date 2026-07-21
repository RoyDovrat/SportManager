package com.sportmanager.controller;

import com.sportmanager.dto.request.ClothingPricingRequest;
import com.sportmanager.dto.request.ClothingPricingUpdateRequest;
import com.sportmanager.dto.response.ClothingPricingResponse;
import com.sportmanager.service.ClothingPricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clothing-pricing")
@RequiredArgsConstructor
public class ClothingPricingController {

    private final ClothingPricingService clothingPricingService;

    @PostMapping
    public ResponseEntity<ClothingPricingResponse> createClothingPricing(
            @Valid @RequestBody ClothingPricingRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clothingPricingService.createClothingPricing(request));
    }

    @GetMapping
    public ResponseEntity<List<ClothingPricingResponse>> getAllClothingPricing() {
        return ResponseEntity.ok(clothingPricingService.getAllClothingPricing());
    }

    @GetMapping("/{pricingId}")
    public ResponseEntity<ClothingPricingResponse> getClothingPricingById(
            @PathVariable Long pricingId
    ) {
        return ResponseEntity.ok(clothingPricingService.getClothingPricingById(pricingId));
    }

    @GetMapping("/season/{seasonId}")
    public ResponseEntity<ClothingPricingResponse> getClothingPricingBySeason(
            @PathVariable Long seasonId
    ) {
        return ResponseEntity.ok(clothingPricingService.getClothingPricingBySeason(seasonId));
    }

    @PutMapping("/{pricingId}")
    public ResponseEntity<ClothingPricingResponse> updateClothingPricing(
            @PathVariable Long pricingId,
            @Valid @RequestBody ClothingPricingUpdateRequest request
    ) {
        return ResponseEntity.ok(
                clothingPricingService.updateClothingPricing(pricingId, request)
        );
    }
}
