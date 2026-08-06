package com.sportmanager.service;

import com.sportmanager.dto.response.ClothingCatalogResponse;
import com.sportmanager.dto.response.ClothingEligibilityResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ClothingPricing;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.ClothingOrderRepository;
import com.sportmanager.repository.ClothingPricingRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import com.sportmanager.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClothingCatalogService {

    private final SeasonRepository seasonRepository;
    private final ClothingPricingRepository clothingPricingRepository;
    private final StudentRepository studentRepository;
    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;
    private final ClothingOrderRepository clothingOrderRepository;

    @Transactional(readOnly = true)
    public ClothingCatalogResponse getActiveSeasonCatalog() {
        Season season = seasonRepository
                .findFirstByIsActiveAndActivityType(true, ActivityType.FOOTBALL)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active football season was found"
                ));

        ClothingPricing pricing = clothingPricingRepository.findBySeasonId(season.getId())
                .orElse(null);

        boolean allowSkip = pricing == null
                || pricing.getAllowAlreadyHasClothingSkip() == null
                || Boolean.TRUE.equals(pricing.getAllowAlreadyHasClothingSkip());
        boolean longKitEnabled = pricing == null
                || pricing.getLongKitPublicEnabled() == null
                || Boolean.TRUE.equals(pricing.getLongKitPublicEnabled());
        boolean hoodieEnabled = pricing == null
                || pricing.getHoodiePublicEnabled() == null
                || Boolean.TRUE.equals(pricing.getHoodiePublicEnabled());

        return ClothingCatalogResponse.builder()
                .seasonId(season.getId())
                .seasonName(season.getName())
                .pricingConfigured(pricing != null)
                .shortKitPrice(pricing != null ? pricing.getShortKitPrice() : null)
                .longKitPrice(pricing != null ? pricing.getLongKitPrice() : null)
                .hoodiePrice(pricing != null ? pricing.getHoodiePrice() : null)
                .allowAlreadyHasClothingSkip(allowSkip)
                .longKitPublicEnabled(longKitEnabled)
                .hoodiePublicEnabled(hoodieEnabled)
                .build();
    }

    @Transactional(readOnly = true)
    public ClothingEligibilityResponse checkEligibility(Long seasonId, String studentIdentityNumber) {
        if (seasonId == null) {
            throw new BusinessRuleException("seasonId is required");
        }
        if (studentIdentityNumber == null || studentIdentityNumber.isBlank()) {
            throw new BusinessRuleException("Student identity number is required");
        }

        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));

        Student student = studentRepository.findByIdentityNumber(studentIdentityNumber.trim())
                .orElseThrow(() -> new BusinessRuleException(
                        "Student was not found with this identity number"
                ));

        Activity football = activityRepository.findByActivityType(ActivityType.FOOTBALL)
                .orElseThrow(() -> new ResourceNotFoundException("Football activity was not found"));

        Registration registration = registrationRepository
                .findByStudentAndActivityAndSeason(student, football, season)
                .orElseThrow(() -> new BusinessRuleException(
                        "Student is not registered for football in this season"
                ));

        if (registration.getStatus() != RegistrationStatus.APPROVED) {
            throw new BusinessRuleException(
                    "Clothing can only be ordered for an approved registration"
            );
        }

        if (clothingOrderRepository.existsByRegistration(registration)) {
            throw new BusinessRuleException(
                    "A clothing order already exists for this registration"
            );
        }

        return ClothingEligibilityResponse.builder()
                .eligible(true)
                .seasonId(season.getId())
                .registrationId(registration.getId())
                .studentId(student.getId())
                .studentIdentityNumber(student.getIdentityNumber())
                .studentFirstName(student.getFirstName())
                .studentLastName(student.getLastName())
                .build();
    }
}
