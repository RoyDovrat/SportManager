package com.sportmanager.service;

import com.sportmanager.dto.response.SwimmingCatalogPriceResponse;
import com.sportmanager.dto.response.SwimmingCatalogResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityPricing;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ActivityPricingRepository;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.SeasonRepository;
import com.sportmanager.repository.SwimmingRegistrationSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SwimmingCatalogService {

    private final SeasonRepository seasonRepository;
    private final ActivityRepository activityRepository;
    private final ActivityPricingRepository activityPricingRepository;
    private final SwimmingRegistrationSettingsRepository settingsRepository;
    private final SwimmingRegistrationSettingsService settingsService;

    @Transactional(readOnly = true)
    public SwimmingCatalogResponse getActiveSeasonCatalog() {
        Season season = seasonRepository
                .findFirstByIsActiveAndActivityType(true, ActivityType.SWIMMING)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active swimming season was found"
                ));

        Activity activity = activityRepository.findByActivityType(ActivityType.SWIMMING)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Swimming activity was not found"
                ));

        if (!Boolean.TRUE.equals(activity.getIsActive())) {
            throw new BusinessRuleException("Swimming activity is not active");
        }

        String introMarkdown = settingsRepository.findBySeasonId(season.getId())
                .map(settings -> settings.getIntroMarkdown() == null ? "" : settings.getIntroMarkdown())
                .orElse("");

        int groupWeeklySessions = settingsService.resolveGroupWeeklySessions(season.getId());

        Map<SwimmingLessonType, ActivityPricing> unitByType = new EnumMap<>(SwimmingLessonType.class);
        activityPricingRepository.findBySeasonId(season.getId())
                .stream()
                .filter(row -> row.getActivity().getActivityType() == ActivityType.SWIMMING)
                .filter(row -> row.getSwimmingLessonType() != null)
                .filter(row -> row.getWeeklySessions() != null)
                .forEach(row -> {
                    SwimmingLessonType type = row.getSwimmingLessonType();
                    ActivityPricing existing = unitByType.get(type);
                    if (existing == null || isBetterUnitRow(row, existing)) {
                        unitByType.put(type, row);
                    }
                });

        List<SwimmingCatalogPriceResponse> prices = unitByType.values().stream()
                .sorted(Comparator.comparing(row -> row.getSwimmingLessonType().ordinal()))
                .map(row -> SwimmingCatalogPriceResponse.builder()
                        .swimmingLessonType(row.getSwimmingLessonType())
                        .unitMonthlyPrice(row.getMonthlyPrice())
                        .activityPricingId(row.getId())
                        .build())
                .toList();

        return SwimmingCatalogResponse.builder()
                .seasonId(season.getId())
                .seasonName(season.getName())
                .activityId(activity.getId())
                .introMarkdown(introMarkdown)
                .groupWeeklySessions(groupWeeklySessions)
                .prices(prices)
                .build();
    }

    /**
     * Prefer weeklySessions == 1 (canonical unit price); otherwise the lowest sessions row.
     */
    private boolean isBetterUnitRow(ActivityPricing candidate, ActivityPricing current) {
        int candidateSessions = candidate.getWeeklySessions();
        int currentSessions = current.getWeeklySessions();
        if (candidateSessions == 1 && currentSessions != 1) {
            return true;
        }
        if (currentSessions == 1 && candidateSessions != 1) {
            return false;
        }
        return candidateSessions < currentSessions;
    }
}
