package com.sportmanager.service;

import com.sportmanager.dto.request.ClothingPricingRequest;
import com.sportmanager.dto.request.ClothingPricingUpdateRequest;
import com.sportmanager.dto.response.ClothingPricingResponse;
import com.sportmanager.entity.ClothingPricing;
import com.sportmanager.entity.Season;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ClothingPricingRepository;
import com.sportmanager.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClothingPricingService {

    private final ClothingPricingRepository clothingPricingRepository;
    private final SeasonRepository seasonRepository;

    @Transactional
    public ClothingPricingResponse createClothingPricing(ClothingPricingRequest request) {
        Season season = getSeason(request.getSeasonId());
        validatePricingDetails(
                request.getShortKitPrice(),
                request.getLongKitPrice(),
                request.getHoodiePrice()
        );
        validatePricingDoesNotExist(season);

        ClothingPricing clothingPricing = new ClothingPricing();
        clothingPricing.setSeason(season);
        clothingPricing.setShortKitPrice(request.getShortKitPrice());
        clothingPricing.setLongKitPrice(request.getLongKitPrice());
        clothingPricing.setHoodiePrice(request.getHoodiePrice());

        return toResponse(clothingPricingRepository.save(clothingPricing));
    }

    @Transactional(readOnly = true)
    public ClothingPricingResponse getClothingPricingById(Long pricingId) {
        return toResponse(getPricingEntity(pricingId));
    }

    @Transactional(readOnly = true)
    public ClothingPricingResponse getClothingPricingBySeason(Long seasonId) {
        getSeason(seasonId);
        ClothingPricing pricing = clothingPricingRepository.findBySeasonId(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Clothing pricing was not found for season id: " + seasonId
                ));
        return toResponse(pricing);
    }

    @Transactional(readOnly = true)
    public List<ClothingPricingResponse> getAllClothingPricing() {
        return clothingPricingRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ClothingPricingResponse updateClothingPricing(
            Long pricingId,
            ClothingPricingUpdateRequest request
    ) {
        ClothingPricing pricing = getPricingEntity(pricingId);
        validatePricingDetails(
                request.getShortKitPrice(),
                request.getLongKitPrice(),
                request.getHoodiePrice()
        );

        pricing.setShortKitPrice(request.getShortKitPrice());
        pricing.setLongKitPrice(request.getLongKitPrice());
        pricing.setHoodiePrice(request.getHoodiePrice());

        return toResponse(clothingPricingRepository.save(pricing));
    }

    private ClothingPricing getPricingEntity(Long pricingId) {
        return clothingPricingRepository.findById(pricingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Clothing pricing was not found with id: " + pricingId
                ));
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));
    }

    private void validatePricingDetails(
            BigDecimal shortKitPrice,
            BigDecimal longKitPrice,
            BigDecimal hoodiePrice
    ) {
        validatePrice(shortKitPrice, "Short kit price");
        validatePrice(longKitPrice, "Long kit price");
        validatePrice(hoodiePrice, "Hoodie price");
    }

    private void validatePrice(BigDecimal price, String fieldName) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException(fieldName + " must be greater than zero");
        }
    }

    private void validatePricingDoesNotExist(Season season) {
        if (clothingPricingRepository.existsBySeason(season)) {
            throw new ConflictException("Clothing pricing already exists for this season");
        }
    }

    private ClothingPricingResponse toResponse(ClothingPricing pricing) {
        return ClothingPricingResponse.builder()
                .id(pricing.getId())
                .seasonId(pricing.getSeason().getId())
                .seasonName(pricing.getSeason().getName())
                .shortKitPrice(pricing.getShortKitPrice())
                .longKitPrice(pricing.getLongKitPrice())
                .hoodiePrice(pricing.getHoodiePrice())
                .build();
    }
}
