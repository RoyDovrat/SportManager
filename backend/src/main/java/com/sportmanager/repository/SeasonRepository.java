package com.sportmanager.repository;

import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeasonRepository extends JpaRepository<Season, Long> {

    Optional<Season> findByName(String name);

    boolean existsByName(String name);

    boolean existsByNameAndIdNot(String name, Long id);

    List<Season> findByIsActive(Boolean isActive);

    List<Season> findByIsActiveAndActivityType(Boolean isActive, ActivityType activityType);

    Optional<Season> findFirstByIsActiveAndActivityType(Boolean isActive, ActivityType activityType);
}
