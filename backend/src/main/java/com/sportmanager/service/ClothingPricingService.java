package com.sportmanager.service;

import com.sportmanager.dto.request.ClothingPricingRequest;
import com.sportmanager.entity.ClothingPricing;
import com.sportmanager.entity.Season;
import com.sportmanager.repository.ClothingPricingRepository;
import com.sportmanager.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ClothingPricingService {

    private final ClothingPricingRepository clothingPricingRepository;
    private final SeasonRepository seasonRepository;

    @Transactional
    public ClothingPricing createClothingPricing(ClothingPricingRequest request) {
        Season season = getSeason(request.getSeasonId());

        validatePricingDetails(request);

        validatePricingDoesNotExist(season);

        ClothingPricing clothingPricing = buildClothingPricing(request, season);

        return clothingPricingRepository.save(clothingPricing);
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository
                .findById(seasonId)
                .orElseThrow(() -> new RuntimeException("Season not found"));
    }

    private void validatePricingDetails(ClothingPricingRequest request) {
        validatePrice(request.getShortKitPrice(), "Short kit price");

        validatePrice(request.getLongKitPrice(), "Long kit price");

        validatePrice(request.getHoodiePrice(), "Hoodie price");
    }

    private void validatePrice(BigDecimal price, String fieldName) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {

            throw new RuntimeException(fieldName + " must be greater than zero");
        }
    }

    private void validatePricingDoesNotExist(Season season) {
        boolean exists =clothingPricingRepository.existsBySeason(season);

        if (exists) {
            throw new RuntimeException("Clothing pricing already exists for this season");
        }
    }

    private ClothingPricing buildClothingPricing(ClothingPricingRequest request, Season season) {
        ClothingPricing clothingPricing = new ClothingPricing();

        clothingPricing.setSeason(season);

        clothingPricing.setShortKitPrice(request.getShortKitPrice());

        clothingPricing.setLongKitPrice(request.getLongKitPrice());

        clothingPricing.setHoodiePrice(request.getHoodiePrice());

        return clothingPricing;
    }
}