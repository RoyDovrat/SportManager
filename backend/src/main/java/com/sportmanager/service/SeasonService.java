package com.sportmanager.service;

import com.sportmanager.dto.request.SeasonRequest;
import com.sportmanager.dto.response.SeasonResponse;
import com.sportmanager.entity.Season;
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
            deactivateAllSeasons();
        }

        Season season = new Season();
        season.setName(request.getName());
        season.setStartDate(request.getStartDate());
        season.setEndDate(request.getEndDate());
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
    public SeasonResponse getActiveSeason() {
        List<Season> activeSeasons = seasonRepository.findByIsActive(true);

        if (activeSeasons.isEmpty()) {
            throw new BusinessRuleException("No active season was found");
        }

        return toResponse(activeSeasons.getFirst());
    }

    @Transactional
    public SeasonResponse updateSeason(Long seasonId, SeasonRequest request) {
        Season season = getSeasonEntity(seasonId);

        validateDates(request.getStartDate(), request.getEndDate());
        validateSeasonNameIsAvailable(request.getName(), seasonId);

        if (Boolean.TRUE.equals(request.getIsActive())) {
            deactivateAllSeasonsExcept(seasonId);
        }

        season.setName(request.getName());
        season.setStartDate(request.getStartDate());
        season.setEndDate(request.getEndDate());
        season.setIsActive(request.getIsActive());

        return toResponse(seasonRepository.save(season));
    }

    @Transactional
    public SeasonResponse activateSeason(Long seasonId) {
        Season season = getSeasonEntity(seasonId);
        deactivateAllSeasonsExcept(seasonId);
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

    private void deactivateAllSeasons() {
        List<Season> activeSeasons = seasonRepository.findByIsActive(true);
        for (Season activeSeason : activeSeasons) {
            activeSeason.setIsActive(false);
        }
        seasonRepository.saveAll(activeSeasons);
    }

    private void deactivateAllSeasonsExcept(Long seasonId) {
        List<Season> activeSeasons = seasonRepository.findByIsActive(true);
        for (Season activeSeason : activeSeasons) {
            if (!activeSeason.getId().equals(seasonId)) {
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
                .isActive(season.getIsActive())
                .build();
    }
}
