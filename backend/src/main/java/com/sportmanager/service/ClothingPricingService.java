package com.sportmanager.service;

import com.sportmanager.dto.request.ClothingPricingRequest;
import com.sportmanager.dto.request.ClothingPricingUpdateRequest;
import com.sportmanager.dto.response.ClothingPricingResponse;
import com.sportmanager.entity.ClothingPricing;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ClothingPricingRepository;
import com.sportmanager.repository.SeasonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ClothingPricingService {

    private final ClothingPricingRepository clothingPricingRepository;
    private final SeasonRepository seasonRepository;

    public ClothingPricingService(
            ClothingPricingRepository clothingPricingRepository,
            SeasonRepository seasonRepository
    ) {
        this.clothingPricingRepository = clothingPricingRepository;
        this.seasonRepository = seasonRepository;
    }

    @Transactional
    public ClothingPricingResponse createClothingPricing(ClothingPricingRequest request) {
        Season season = getSeason(request.getSeasonId());
        boolean longKitEnabled = Boolean.TRUE.equals(request.getLongKitPublicEnabled());
        boolean hoodieEnabled = Boolean.TRUE.equals(request.getHoodiePublicEnabled());
        BigDecimal longKitPrice = resolveOptionalItemPrice(
                request.getLongKitPrice(),
                longKitEnabled,
                "Long kit price"
        );
        BigDecimal hoodiePrice = resolveOptionalItemPrice(
                request.getHoodiePrice(),
                hoodieEnabled,
                "Hoodie price"
        );
        validatePrice(request.getShortKitPrice(), "Short kit price");
        validatePricingDoesNotExist(season);

        ClothingPricing clothingPricing = new ClothingPricing();
        clothingPricing.setSeason(season);
        clothingPricing.setShortKitPrice(request.getShortKitPrice());
        clothingPricing.setLongKitPrice(longKitPrice);
        clothingPricing.setHoodiePrice(hoodiePrice);
        clothingPricing.setAllowAlreadyHasClothingSkip(
                Boolean.TRUE.equals(request.getAllowAlreadyHasClothingSkip())
        );
        clothingPricing.setLongKitPublicEnabled(longKitEnabled);
        clothingPricing.setHoodiePublicEnabled(hoodieEnabled);

        return toResponse(clothingPricingRepository.save(clothingPricing));
    }

    @Transactional(readOnly = true)
    public ClothingPricingResponse getClothingPricingById(Long pricingId) {
        return toResponse(getPricingEntity(pricingId));
    }

    @Transactional(readOnly = true)
    public ClothingPricingResponse getClothingPricingBySeason(Long seasonId) {
        // Read by season id without football-only gate so Edit can load existing rows.
        if (!seasonRepository.existsById(seasonId)) {
            throw new ResourceNotFoundException(
                    "Season was not found with id: " + seasonId
            );
        }
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
        boolean longKitEnabled = Boolean.TRUE.equals(request.getLongKitPublicEnabled());
        boolean hoodieEnabled = Boolean.TRUE.equals(request.getHoodiePublicEnabled());
        BigDecimal longKitPrice = resolveOptionalItemPrice(
                request.getLongKitPrice(),
                longKitEnabled,
                "Long kit price"
        );
        BigDecimal hoodiePrice = resolveOptionalItemPrice(
                request.getHoodiePrice(),
                hoodieEnabled,
                "Hoodie price"
        );
        validatePrice(request.getShortKitPrice(), "Short kit price");

        pricing.setShortKitPrice(request.getShortKitPrice());
        pricing.setLongKitPrice(longKitPrice);
        pricing.setHoodiePrice(hoodiePrice);
        pricing.setAllowAlreadyHasClothingSkip(
                Boolean.TRUE.equals(request.getAllowAlreadyHasClothingSkip())
        );
        pricing.setLongKitPublicEnabled(longKitEnabled);
        pricing.setHoodiePublicEnabled(hoodieEnabled);

        return toResponse(clothingPricingRepository.save(pricing));
    }

    private ClothingPricing getPricingEntity(Long pricingId) {
        return clothingPricingRepository.findById(pricingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Clothing pricing was not found with id: " + pricingId
                ));
    }

    private Season getSeason(Long seasonId) {
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));
        if (season.getActivityType() != ActivityType.FOOTBALL) {
            throw new BusinessRuleException(
                    "Clothing pricing can only be configured for football seasons"
            );
        }
        return season;
    }

    /**
     * When an optional clothing item is disabled for the public form, store 0 and
     * skip price validation. When enabled, require a positive price.
     */
    private BigDecimal resolveOptionalItemPrice(
            BigDecimal price,
            boolean enabled,
            String fieldName
    ) {
        if (!enabled) {
            return BigDecimal.ZERO;
        }
        validatePrice(price, fieldName);
        return price;
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
        ClothingPricingResponse response = new ClothingPricingResponse();
        response.setId(pricing.getId());
        response.setSeasonId(pricing.getSeason().getId());
        response.setSeasonName(pricing.getSeason().getName());
        response.setShortKitPrice(pricing.getShortKitPrice());
        response.setLongKitPrice(pricing.getLongKitPrice());
        response.setHoodiePrice(pricing.getHoodiePrice());
        response.setAllowAlreadyHasClothingSkip(
                pricing.getAllowAlreadyHasClothingSkip() == null
                        || Boolean.TRUE.equals(pricing.getAllowAlreadyHasClothingSkip())
        );
        response.setLongKitPublicEnabled(
                pricing.getLongKitPublicEnabled() == null
                        || Boolean.TRUE.equals(pricing.getLongKitPublicEnabled())
        );
        response.setHoodiePublicEnabled(
                pricing.getHoodiePublicEnabled() == null
                        || Boolean.TRUE.equals(pricing.getHoodiePublicEnabled())
        );
        return response;
    }
}
