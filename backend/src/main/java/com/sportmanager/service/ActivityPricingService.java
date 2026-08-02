package com.sportmanager.service;

import com.sportmanager.dto.request.ActivityPricingRequest;
import com.sportmanager.dto.request.ActivityPricingUpdateRequest;
import com.sportmanager.dto.response.ActivityPricingResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityPricing;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ActivityPricingRepository;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityPricingService {

    private final ActivityPricingRepository activityPricingRepository;
    private final ActivityRepository activityRepository;
    private final SeasonRepository seasonRepository;

    @Transactional
    public ActivityPricingResponse createActivityPricing(ActivityPricingRequest request) {
        Season season = getSeason(request.getSeasonId());
        Activity activity = getActivity(request.getActivityType());

        validatePricingDetails(request);
        validatePricingDoesNotExist(request, season, activity);

        ActivityPricing saved = activityPricingRepository.save(
                buildActivityPricing(request, season, activity)
        );
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ActivityPricingResponse getActivityPricingById(Long pricingId) {
        return toResponse(getPricingEntity(pricingId));
    }

    @Transactional(readOnly = true)
    public List<ActivityPricingResponse> getActivityPricingBySeason(Long seasonId) {
        getSeason(seasonId);
        return activityPricingRepository.findBySeasonId(seasonId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ActivityPricingResponse updateActivityPricing(
            Long pricingId,
            ActivityPricingUpdateRequest request
    ) {
        ActivityPricing pricing = getPricingEntity(pricingId);
        ActivityType activityType = pricing.getActivity().getActivityType();

        if (request.getMonthlyPrice() == null
                || request.getMonthlyPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Monthly price must be greater than zero");
        }

        if (activityType == ActivityType.FOOTBALL) {
            if (request.getWeeklySessions() != null) {
                if (request.getWeeklySessions() != 1 && request.getWeeklySessions() != 2) {
                    throw new BusinessRuleException(
                            "Football pricing requires weeklySessions of 1 or 2"
                    );
                }
                validateFootballSessionsAvailable(pricing, request.getWeeklySessions());
                pricing.setWeeklySessions(request.getWeeklySessions());
            }
        } else if (activityType == ActivityType.SWIMMING) {
            if (request.getWeeklySessions() != null) {
                if (request.getWeeklySessions() <= 0) {
                    throw new BusinessRuleException(
                            "Weekly sessions must be greater than zero"
                    );
                }
                validateSwimmingSessionsAvailable(pricing, request.getWeeklySessions());
                pricing.setWeeklySessions(request.getWeeklySessions());
            }
        }

        pricing.setMonthlyPrice(request.getMonthlyPrice());
        return toResponse(activityPricingRepository.save(pricing));
    }

    private void validateFootballSessionsAvailable(
            ActivityPricing pricing,
            Integer weeklySessions
    ) {
        boolean exists = activityPricingRepository
                .existsBySeasonAndActivityAndWeeklySessionsAndAgeGroupIsNull(
                        pricing.getSeason(),
                        pricing.getActivity(),
                        weeklySessions
                );

        if (exists && !weeklySessions.equals(pricing.getWeeklySessions())) {
            throw new ConflictException(
                    "Football pricing already exists for this weekly sessions value"
            );
        }
    }

    private void validateSwimmingSessionsAvailable(
            ActivityPricing pricing,
            Integer weeklySessions
    ) {
        boolean exists = activityPricingRepository
                .existsBySeasonAndActivityAndSwimmingLessonTypeAndWeeklySessions(
                        pricing.getSeason(),
                        pricing.getActivity(),
                        pricing.getSwimmingLessonType(),
                        weeklySessions
                );

        if (exists && !weeklySessions.equals(pricing.getWeeklySessions())) {
            throw new ConflictException(
                    "Activity pricing already exists for this swimming lesson type and weekly sessions"
            );
        }
    }

    private ActivityPricing getPricingEntity(Long pricingId) {
        return activityPricingRepository.findById(pricingId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Activity pricing was not found with id: " + pricingId
                ));
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));
    }

    private Activity getActivity(ActivityType activityType) {
        return activityRepository.findByActivityType(activityType)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Activity was not found with type: " + activityType
                ));
    }

    private void validatePricingDetails(ActivityPricingRequest request) {
        BigDecimal monthlyPrice = request.getMonthlyPrice();
        if (monthlyPrice == null || monthlyPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Monthly price must be greater than zero");
        }

        if (request.getActivityType() == ActivityType.FOOTBALL) {
            if (request.getAgeGroup() != null) {
                throw new BusinessRuleException(
                        "Age group must not be provided for football pricing"
                );
            }
            if (request.getSwimmingLessonType() != null) {
                throw new BusinessRuleException(
                        "Swimming lesson type must not be provided for football"
                );
            }
            if (request.getWeeklySessions() == null
                    || (request.getWeeklySessions() != 1 && request.getWeeklySessions() != 2)) {
                throw new BusinessRuleException(
                        "Football pricing requires weeklySessions of 1 or 2"
                );
            }
            return;
        }

        if (request.getActivityType() == ActivityType.SWIMMING) {
            if (request.getSwimmingLessonType() == null) {
                throw new BusinessRuleException(
                        "Swimming lesson type is required for swimming pricing"
                );
            }
            if (request.getAgeGroup() != null) {
                throw new BusinessRuleException(
                        "Age group must not be provided for swimming pricing"
                );
            }
            if (request.getWeeklySessions() == null || request.getWeeklySessions() <= 0) {
                throw new BusinessRuleException(
                        "Weekly sessions must be greater than zero for swimming pricing"
                );
            }
            return;
        }

        throw new BusinessRuleException("Unsupported activity type");
    }

    private void validatePricingDoesNotExist(
            ActivityPricingRequest request,
            Season season,
            Activity activity
    ) {
        boolean exists;
        if (request.getActivityType() == ActivityType.FOOTBALL) {
            exists = activityPricingRepository
                    .existsBySeasonAndActivityAndWeeklySessionsAndAgeGroupIsNull(
                            season,
                            activity,
                            request.getWeeklySessions()
                    );
        } else {
            exists = activityPricingRepository
                    .existsBySeasonAndActivityAndSwimmingLessonTypeAndWeeklySessions(
                            season,
                            activity,
                            request.getSwimmingLessonType(),
                            request.getWeeklySessions()
                    );
        }

        if (exists) {
            throw new ConflictException("Activity pricing already exists");
        }
    }

    private ActivityPricing buildActivityPricing(
            ActivityPricingRequest request,
            Season season,
            Activity activity
    ) {
        ActivityPricing pricing = new ActivityPricing();
        pricing.setSeason(season);
        pricing.setActivity(activity);
        pricing.setMonthlyPrice(request.getMonthlyPrice());

        if (request.getActivityType() == ActivityType.FOOTBALL) {
            pricing.setAgeGroup(null);
            pricing.setSwimmingLessonType(null);
            pricing.setWeeklySessions(request.getWeeklySessions());
        } else {
            pricing.setAgeGroup(null);
            pricing.setSwimmingLessonType(request.getSwimmingLessonType());
            pricing.setWeeklySessions(request.getWeeklySessions());
        }

        return pricing;
    }

    private ActivityPricingResponse toResponse(ActivityPricing pricing) {
        return ActivityPricingResponse.builder()
                .id(pricing.getId())
                .seasonId(pricing.getSeason().getId())
                .seasonName(pricing.getSeason().getName())
                .activityId(pricing.getActivity().getId())
                .activityType(pricing.getActivity().getActivityType())
                .ageGroup(pricing.getAgeGroup())
                .swimmingLessonType(pricing.getSwimmingLessonType())
                .weeklySessions(pricing.getWeeklySessions())
                .monthlyPrice(pricing.getMonthlyPrice())
                .build();
    }
}
