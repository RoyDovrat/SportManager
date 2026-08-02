package com.sportmanager.service;

import com.sportmanager.dto.request.ActivityPricingRequest;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityPricing;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.repository.ActivityPricingRepository;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.SeasonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityPricingServiceFootballWeeklySessionsTest {

    @Mock
    private ActivityPricingRepository activityPricingRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private SeasonRepository seasonRepository;

    @InjectMocks
    private ActivityPricingService activityPricingService;

    private Season season;
    private Activity football;

    @BeforeEach
    void setUp() {
        season = new Season();
        season.setId(1L);
        football = new Activity();
        football.setId(2L);
        football.setActivityType(ActivityType.FOOTBALL);
    }

    @Test
    void createFootballPricing_rejectsAgeGroup() {
        stubLookups();
        ActivityPricingRequest request = baseRequest(2);
        request.setAgeGroup(AgeGroup.GRADE_1);

        assertThatThrownBy(() -> activityPricingService.createActivityPricing(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Age group");
    }

    @Test
    void createFootballPricing_rejectsDuplicateWeeklySessions() {
        stubLookups();
        when(activityPricingRepository
                .existsBySeasonAndActivityAndWeeklySessionsAndAgeGroupIsNull(
                        season, football, 2))
                .thenReturn(true);

        assertThatThrownBy(() -> activityPricingService.createActivityPricing(baseRequest(2)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void createFootballPricing_persistsWeeklySessionsWithoutAgeGroup() {
        stubLookups();
        when(activityPricingRepository
                .existsBySeasonAndActivityAndWeeklySessionsAndAgeGroupIsNull(
                        season, football, 1))
                .thenReturn(false);
        when(activityPricingRepository.save(any(ActivityPricing.class))).thenAnswer(inv -> {
            ActivityPricing pricing = inv.getArgument(0);
            pricing.setId(10L);
            return pricing;
        });

        activityPricingService.createActivityPricing(baseRequest(1));

        verify(activityPricingRepository).save(any(ActivityPricing.class));
    }

    private void stubLookups() {
        when(seasonRepository.findById(1L)).thenReturn(Optional.of(season));
        when(activityRepository.findByActivityType(ActivityType.FOOTBALL))
                .thenReturn(Optional.of(football));
    }

    private static ActivityPricingRequest baseRequest(int weeklySessions) {
        ActivityPricingRequest request = new ActivityPricingRequest();
        request.setSeasonId(1L);
        request.setActivityType(ActivityType.FOOTBALL);
        request.setWeeklySessions(weeklySessions);
        request.setMonthlyPrice(new BigDecimal("185.00"));
        return request;
    }
}
