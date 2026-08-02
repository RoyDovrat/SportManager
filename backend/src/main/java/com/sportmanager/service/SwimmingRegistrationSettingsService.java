package com.sportmanager.service;

import com.sportmanager.dto.request.SwimmingRegistrationSettingsRequest;
import com.sportmanager.dto.request.SwimmingRegistrationSettingsUpdateRequest;
import com.sportmanager.dto.response.SwimmingRegistrationSettingsResponse;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.SwimmingRegistrationSettings;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.SeasonRepository;
import com.sportmanager.repository.SwimmingRegistrationSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SwimmingRegistrationSettingsService {

    public static final int DEFAULT_GROUP_WEEKLY_SESSIONS = 2;

    private final SwimmingRegistrationSettingsRepository settingsRepository;
    private final SeasonRepository seasonRepository;

    @Transactional
    public SwimmingRegistrationSettingsResponse create(SwimmingRegistrationSettingsRequest request) {
        Season season = getSeason(request.getSeasonId());
        if (settingsRepository.existsBySeason(season)) {
            throw new ConflictException(
                    "Swimming registration settings already exist for this season"
            );
        }

        SwimmingRegistrationSettings settings = new SwimmingRegistrationSettings();
        settings.setSeason(season);
        settings.setIntroMarkdown(normalizeMarkdown(request.getIntroMarkdown()));
        settings.setGroupWeeklySessions(normalizeGroupWeeklySessions(request.getGroupWeeklySessions()));
        return toResponse(settingsRepository.save(settings));
    }

    @Transactional(readOnly = true)
    public SwimmingRegistrationSettingsResponse getById(Long settingsId) {
        return toResponse(getEntity(settingsId));
    }

    @Transactional(readOnly = true)
    public SwimmingRegistrationSettingsResponse getBySeason(Long seasonId) {
        getSeason(seasonId);
        SwimmingRegistrationSettings settings = settingsRepository.findBySeasonId(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Swimming registration settings were not found for season id: " + seasonId
                ));
        return toResponse(settings);
    }

    @Transactional(readOnly = true)
    public List<SwimmingRegistrationSettingsResponse> getAll() {
        return settingsRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public SwimmingRegistrationSettingsResponse update(
            Long settingsId,
            SwimmingRegistrationSettingsUpdateRequest request
    ) {
        SwimmingRegistrationSettings settings = getEntity(settingsId);
        settings.setIntroMarkdown(normalizeMarkdown(request.getIntroMarkdown()));
        if (request.getGroupWeeklySessions() != null) {
            settings.setGroupWeeklySessions(
                    normalizeGroupWeeklySessions(request.getGroupWeeklySessions())
            );
        } else if (settings.getGroupWeeklySessions() == null) {
            settings.setGroupWeeklySessions(DEFAULT_GROUP_WEEKLY_SESSIONS);
        }
        return toResponse(settingsRepository.save(settings));
    }

    @Transactional(readOnly = true)
    public int resolveGroupWeeklySessions(Long seasonId) {
        return settingsRepository.findBySeasonId(seasonId)
                .map(settings -> settings.getGroupWeeklySessions() == null
                        ? DEFAULT_GROUP_WEEKLY_SESSIONS
                        : settings.getGroupWeeklySessions())
                .orElse(DEFAULT_GROUP_WEEKLY_SESSIONS);
    }

    private SwimmingRegistrationSettings getEntity(Long settingsId) {
        return settingsRepository.findById(settingsId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Swimming registration settings were not found with id: " + settingsId
                ));
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));
    }

    private String normalizeMarkdown(String value) {
        if (value == null) {
            return "";
        }
        return value.trim();
    }

    private int normalizeGroupWeeklySessions(Integer value) {
        int sessions = value == null ? DEFAULT_GROUP_WEEKLY_SESSIONS : value;
        if (sessions < 1 || sessions > 6) {
            throw new BusinessRuleException(
                    "Group weekly sessions must be between 1 and 6"
            );
        }
        return sessions;
    }

    private SwimmingRegistrationSettingsResponse toResponse(SwimmingRegistrationSettings settings) {
        return SwimmingRegistrationSettingsResponse.builder()
                .id(settings.getId())
                .seasonId(settings.getSeason().getId())
                .seasonName(settings.getSeason().getName())
                .introMarkdown(settings.getIntroMarkdown() == null ? "" : settings.getIntroMarkdown())
                .groupWeeklySessions(
                        settings.getGroupWeeklySessions() == null
                                ? DEFAULT_GROUP_WEEKLY_SESSIONS
                                : settings.getGroupWeeklySessions()
                )
                .build();
    }
}
