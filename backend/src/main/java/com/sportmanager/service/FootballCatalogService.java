package com.sportmanager.service;

import com.sportmanager.dto.response.FootballCatalogGroupResponse;
import com.sportmanager.dto.response.FootballCatalogPriceResponse;
import com.sportmanager.dto.response.FootballCatalogResponse;
import com.sportmanager.dto.response.GroupTrainingSessionResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityGroup;
import com.sportmanager.entity.ActivityPricing;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ActivityGroupRepository;
import com.sportmanager.repository.ActivityPricingRepository;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FootballCatalogService {

    private final SeasonRepository seasonRepository;
    private final ActivityRepository activityRepository;
    private final ActivityGroupRepository activityGroupRepository;
    private final ActivityPricingRepository activityPricingRepository;

    @Transactional(readOnly = true)
    public FootballCatalogResponse getActiveSeasonCatalog() {
        Season season = seasonRepository.findByIsActive(true).stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No active season was found"));

        Activity activity = activityRepository.findByActivityType(ActivityType.FOOTBALL)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Football activity was not found"
                ));

        if (!Boolean.TRUE.equals(activity.getIsActive())) {
            throw new BusinessRuleException("Football activity is not active");
        }

        List<ActivityPricing> pricingRows = activityPricingRepository.findBySeasonId(season.getId())
                .stream()
                .filter(row -> row.getActivity().getActivityType() == ActivityType.FOOTBALL)
                .filter(row -> row.getAgeGroup() == null)
                .filter(row -> row.getWeeklySessions() != null)
                .toList();

        Map<Integer, ActivityPricing> priceBySessions = pricingRows.stream()
                .collect(Collectors.toMap(
                        ActivityPricing::getWeeklySessions,
                        row -> row,
                        (a, b) -> a
                ));

        List<FootballCatalogPriceResponse> prices = priceBySessions.values().stream()
                .sorted(Comparator.comparing(ActivityPricing::getWeeklySessions))
                .map(row -> FootballCatalogPriceResponse.builder()
                        .weeklySessions(row.getWeeklySessions())
                        .monthlyPrice(row.getMonthlyPrice())
                        .activityPricingId(row.getId())
                        .build())
                .toList();

        List<FootballCatalogGroupResponse> groups = activityGroupRepository
                .findBySeasonIdAndActivityId(season.getId(), activity.getId())
                .stream()
                .filter(group -> Boolean.TRUE.equals(group.getIsActive()))
                .sorted(Comparator.comparing(ActivityGroup::getName))
                .map(group -> toGroupResponse(group, priceBySessions))
                .toList();

        return FootballCatalogResponse.builder()
                .seasonId(season.getId())
                .seasonName(season.getName())
                .activityId(activity.getId())
                .groups(groups)
                .prices(prices)
                .build();
    }

    private FootballCatalogGroupResponse toGroupResponse(
            ActivityGroup group,
            Map<Integer, ActivityPricing> priceBySessions
    ) {
        List<GroupTrainingSessionResponse> sessions =
                group.getTrainingSessions() == null
                        ? List.of()
                        : group.getTrainingSessions().stream()
                                .filter(session -> Boolean.TRUE.equals(session.getIsActive()))
                                .sorted(Comparator
                                        .comparing((com.sportmanager.entity.GroupTrainingSession s)
                                                -> s.getDayOfWeek().getValue())
                                        .thenComparing(com.sportmanager.entity.GroupTrainingSession::getStartTime))
                                .map(session -> GroupTrainingSessionResponse.builder()
                                        .id(session.getId())
                                        .dayOfWeek(session.getDayOfWeek())
                                        .startTime(session.getStartTime())
                                        .endTime(session.getEndTime())
                                        .isActive(session.getIsActive())
                                        .build())
                                .toList();

        // Price follows the actual active weekly schedule (1 or 2), not a stale field.
        Integer weeklySessions = sessions.size() == 1 || sessions.size() == 2
                ? sessions.size()
                : group.getWeeklySessions();
        ActivityPricing pricing = weeklySessions == null
                ? null
                : priceBySessions.get(weeklySessions);

        return FootballCatalogGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .ageGroups(group.getAgeGroups() == null
                        ? Set.of()
                        : Set.copyOf(group.getAgeGroups()))
                .weeklySessions(weeklySessions)
                .trainingSessions(sessions)
                .monthlyPrice(pricing != null ? pricing.getMonthlyPrice() : null)
                .activityPricingId(pricing != null ? pricing.getId() : null)
                .build();
    }
}
