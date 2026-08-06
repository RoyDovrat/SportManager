package com.sportmanager.service;

import com.sportmanager.dto.request.SeasonRequest;
import com.sportmanager.dto.response.SeasonResponse;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SeasonService {

    private final SeasonRepository seasonRepository;

    @Transactional
    public SeasonResponse createSeason(SeasonRequest request) {
        validateDates(request.getStartDate(), request.getEndDate());
        validateSeasonNameDoesNotExist(request.getName());

        if (Boolean.TRUE.equals(request.getIsActive())) {
            deactivateActiveSeasonsOfType(request.getActivityType(), null);
        }

        Season season = new Season();
        season.setName(request.getName());
        season.setStartDate(request.getStartDate());
        season.setEndDate(request.getEndDate());
        season.setActivityType(request.getActivityType());
        season.setIsActive(request.getIsActive());

        return toResponse(seasonRepository.save(season));
    }

    @Transactional(readOnly = true)
    public List<SeasonResponse> getAllSeasons() {
        return seasonRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SeasonResponse getSeasonById(Long seasonId) {
        return toResponse(getSeasonEntity(seasonId));
    }

    @Transactional(readOnly = true)
    public List<SeasonResponse> getActiveSeasons() {
        return seasonRepository.findByIsActive(true).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SeasonResponse getActiveSeason(ActivityType activityType) {
        return toResponse(requireActiveSeasonEntity(activityType));
    }

    @Transactional(readOnly = true)
    public Season requireActiveSeasonEntity(ActivityType activityType) {
        return seasonRepository.findFirstByIsActiveAndActivityType(true, activityType)
                .orElseThrow(() -> new BusinessRuleException(
                        "No active season was found for activity type: " + activityType
                ));
    }

    @Transactional
    public SeasonResponse updateSeason(Long seasonId, SeasonRequest request) {
        Season season = getSeasonEntity(seasonId);

        validateDates(request.getStartDate(), request.getEndDate());
        validateSeasonNameIsAvailable(request.getName(), seasonId);

        if (Boolean.TRUE.equals(request.getIsActive())) {
            deactivateActiveSeasonsOfType(request.getActivityType(), seasonId);
        }

        season.setName(request.getName());
        season.setStartDate(request.getStartDate());
        season.setEndDate(request.getEndDate());
        season.setActivityType(request.getActivityType());
        season.setIsActive(request.getIsActive());

        return toResponse(seasonRepository.save(season));
    }

    @Transactional
    public SeasonResponse activateSeason(Long seasonId) {
        Season season = getSeasonEntity(seasonId);
        deactivateActiveSeasonsOfType(season.getActivityType(), seasonId);
        season.setIsActive(true);
        return toResponse(seasonRepository.save(season));
    }

    @Transactional
    public SeasonResponse deactivateSeason(Long seasonId) {
        Season season = getSeasonEntity(seasonId);
        season.setIsActive(false);
        return toResponse(seasonRepository.save(season));
    }

    private Season getSeasonEntity(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));
    }

    private void validateDates(
            java.time.LocalDate startDate,
            java.time.LocalDate endDate
    ) {
        if (endDate.isBefore(startDate)) {
            throw new BusinessRuleException(
                    "Season end date cannot be before start date"
            );
        }

        if (endDate.isEqual(startDate)) {
            throw new BusinessRuleException(
                    "Season end date must be after start date"
            );
        }
    }

    private void validateSeasonNameDoesNotExist(String name) {
        if (seasonRepository.existsByName(name)) {
            throw new ConflictException("A season already exists with this name");
        }
    }

    private void validateSeasonNameIsAvailable(String name, Long seasonId) {
        if (seasonRepository.existsByNameAndIdNot(name, seasonId)) {
            throw new ConflictException(
                    "Another season already exists with this name"
            );
        }
    }

    private void deactivateActiveSeasonsOfType(ActivityType activityType, Long exceptId) {
        List<Season> activeSeasons =
                seasonRepository.findByIsActiveAndActivityType(true, activityType);
        for (Season activeSeason : activeSeasons) {
            if (exceptId == null || !activeSeason.getId().equals(exceptId)) {
                activeSeason.setIsActive(false);
            }
        }
        seasonRepository.saveAll(activeSeasons);
    }

    private SeasonResponse toResponse(Season season) {
        return SeasonResponse.builder()
                .id(season.getId())
                .name(season.getName())
                .startDate(season.getStartDate())
                .endDate(season.getEndDate())
                .activityType(season.getActivityType())
                .isActive(season.getIsActive())
                .build();
    }
}
