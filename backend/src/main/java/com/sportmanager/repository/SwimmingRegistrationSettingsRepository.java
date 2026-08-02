package com.sportmanager.repository;

import com.sportmanager.entity.Season;
import com.sportmanager.entity.SwimmingRegistrationSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SwimmingRegistrationSettingsRepository
        extends JpaRepository<SwimmingRegistrationSettings, Long> {

    Optional<SwimmingRegistrationSettings> findBySeason(Season season);

    Optional<SwimmingRegistrationSettings> findBySeasonId(Long seasonId);

    boolean existsBySeason(Season season);
}
