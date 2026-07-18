package com.sportmanager.service;

import com.sportmanager.dto.request.SeasonRequest;
import com.sportmanager.entity.Season;
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
    public Season createSeason(SeasonRequest request) {

        validateDates(
                request.getStartDate(),
                request.getEndDate()
        );

        validateSeasonNameDoesNotExist(request.getName());

        if (Boolean.TRUE.equals(request.getIsActive())) {
            deactivateAllSeasons();
        }

        Season season = new Season();

        season.setName(request.getName());
        season.setStartDate(request.getStartDate());
        season.setEndDate(request.getEndDate());
        season.setIsActive(request.getIsActive());

        return seasonRepository.save(season);
    }

    @Transactional(readOnly = true)
    public List<Season> getAllSeasons() {
        return seasonRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Season getSeasonById(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Season was not found with id: " + seasonId
                        )
                );
    }

    @Transactional(readOnly = true)
    public Season getActiveSeason() {

        List<Season> activeSeasons =
                seasonRepository.findByIsActive(true);

        if (activeSeasons.isEmpty()) {
            throw new RuntimeException(
                    "No active season was found"
            );
        }

        return activeSeasons.get(0);
    }

    @Transactional
    public Season updateSeason(
            Long seasonId,
            SeasonRequest request
    ) {
        Season season = getSeasonById(seasonId);

        validateDates(
                request.getStartDate(),
                request.getEndDate()
        );

        validateSeasonNameIsAvailable(
                request.getName(),
                seasonId
        );

        if (Boolean.TRUE.equals(request.getIsActive())) {
            deactivateAllSeasonsExcept(seasonId);
        }

        season.setName(request.getName());
        season.setStartDate(request.getStartDate());
        season.setEndDate(request.getEndDate());
        season.setIsActive(request.getIsActive());

        return seasonRepository.save(season);
    }

    @Transactional
    public Season activateSeason(Long seasonId) {

        Season season = getSeasonById(seasonId);

        deactivateAllSeasonsExcept(seasonId);

        season.setIsActive(true);

        return seasonRepository.save(season);
    }

    @Transactional
    public Season deactivateSeason(Long seasonId) {

        Season season = getSeasonById(seasonId);

        season.setIsActive(false);

        return seasonRepository.save(season);
    }

    private void validateDates(
            java.time.LocalDate startDate,
            java.time.LocalDate endDate
    ) {
        if (endDate.isBefore(startDate)) {
            throw new RuntimeException(
                    "Season end date cannot be before start date"
            );
        }

        if (endDate.isEqual(startDate)) {
            throw new RuntimeException(
                    "Season end date must be after start date"
            );
        }
    }

    private void validateSeasonNameDoesNotExist(String name) {

        if (seasonRepository.existsByName(name)) {
            throw new RuntimeException(
                    "A season already exists with this name"
            );
        }
    }

    private void validateSeasonNameIsAvailable(
            String name,
            Long seasonId
    ) {
        if (seasonRepository.existsByNameAndIdNot(
                name,
                seasonId
        )) {
            throw new RuntimeException(
                    "Another season already exists with this name"
            );
        }
    }

    private void deactivateAllSeasons() {

        List<Season> activeSeasons =
                seasonRepository.findByIsActive(true);

        for (Season activeSeason : activeSeasons) {
            activeSeason.setIsActive(false);
        }

        seasonRepository.saveAll(activeSeasons);
    }

    private void deactivateAllSeasonsExcept(Long seasonId) {

        List<Season> activeSeasons =
                seasonRepository.findByIsActive(true);

        for (Season activeSeason : activeSeasons) {

            if (!activeSeason.getId().equals(seasonId)) {
                activeSeason.setIsActive(false);
            }
        }

        seasonRepository.saveAll(activeSeasons);
    }
}