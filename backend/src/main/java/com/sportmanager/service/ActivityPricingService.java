package com.sportmanager.service;

import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.BusinessRuleException;

import com.sportmanager.dto.request.ActivityPricingRequest;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityPricing;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.repository.ActivityPricingRepository;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class ActivityPricingService {

    private final ActivityPricingRepository activityPricingRepository;
    private final ActivityRepository activityRepository;
    private final SeasonRepository seasonRepository;

    @Transactional
    public ActivityPricing createActivityPricing(
            ActivityPricingRequest request
    ) {
        Season season = getSeason(request.getSeasonId());

        Activity activity = getActivity(
                request.getActivityType()
        );

        validatePricingDetails(request);

        validatePricingDoesNotExist(request, season, activity);

        ActivityPricing activityPricing =buildActivityPricing(request, season,activity);

        return activityPricingRepository.save(activityPricing);
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException("Season not found"));
    }

    private Activity getActivity(ActivityType activityType) {
        return activityRepository
                .findByActivityType(activityType)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found"));
    }

    private void validatePricingDetails(ActivityPricingRequest request) {
        if (request.getActivityType() == null) {
            throw new BusinessRuleException("Activity type is required");
        }

        if (request.getWeeklySessions() == null || request.getWeeklySessions() <= 0) {
            throw new BusinessRuleException("Weekly sessions must be greater than zero");
        }

        BigDecimal monthlyPrice = request.getMonthlyPrice();

        if (monthlyPrice == null || monthlyPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Monthly price must be greater than zero");
        }

        if (request.getActivityType() == ActivityType.FOOTBALL) {

            if (request.getAgeGroup() == null) {
                throw new BusinessRuleException("Age group is required for football pricing");
            }

            if (request.getSwimmingLessonType() != null) {
                throw new BusinessRuleException("Swimming lesson type must not be provided for football");
            }
        }

        if (request.getActivityType() == ActivityType.SWIMMING) {

            if (request.getSwimmingLessonType() == null) {
                throw new BusinessRuleException("Swimming lesson type is required for swimming pricing");
            }

            if (request.getAgeGroup() != null) {
                throw new BusinessRuleException("Age group must not be provided for swimming pricing");
            }
        }
    }

    private void validatePricingDoesNotExist(ActivityPricingRequest request, Season season, Activity activity) {
        boolean exists;

        if (request.getActivityType() == ActivityType.FOOTBALL) {

            exists = activityPricingRepository.existsBySeasonAndActivityAndAgeGroup(season, activity, request.getAgeGroup());
        } else {
            exists = activityPricingRepository.existsBySeasonAndActivityAndSwimmingLessonTypeAndWeeklySessions(season, activity, request.getSwimmingLessonType(), request.getWeeklySessions());
        }

        if (exists) {
            throw new ConflictException("Activity pricing already exists");
        }
    }

    private ActivityPricing buildActivityPricing(ActivityPricingRequest request, Season season, Activity activity) {
        ActivityPricing pricing = new ActivityPricing();

        pricing.setSeason(season);
        pricing.setActivity(activity);
        pricing.setAgeGroup(request.getAgeGroup());
        pricing.setSwimmingLessonType(request.getSwimmingLessonType());
        pricing.setWeeklySessions(request.getWeeklySessions());
        pricing.setMonthlyPrice(request.getMonthlyPrice());

        return pricing;
    }
}