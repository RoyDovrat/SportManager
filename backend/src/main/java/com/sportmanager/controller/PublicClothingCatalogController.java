package com.sportmanager.controller;

import com.sportmanager.dto.response.ClothingCatalogResponse;
import com.sportmanager.dto.response.ClothingEligibilityResponse;
import com.sportmanager.service.ClothingCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicClothingCatalogController {

    private final ClothingCatalogService clothingCatalogService;

    @GetMapping("/clothing-catalog")
    public ResponseEntity<ClothingCatalogResponse> getClothingCatalog() {
        return ResponseEntity.ok(clothingCatalogService.getActiveSeasonCatalog());
    }

    @GetMapping("/clothing-eligibility")
    public ResponseEntity<ClothingEligibilityResponse> checkClothingEligibility(
            @RequestParam Long seasonId,
            @RequestParam String studentIdentityNumber
    ) {
        return ResponseEntity.ok(
                clothingCatalogService.checkEligibility(seasonId, studentIdentityNumber)
        );
    }
}
