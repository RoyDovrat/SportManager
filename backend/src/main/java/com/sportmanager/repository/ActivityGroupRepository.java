package com.sportmanager.repository;

import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityGroup;
import com.sportmanager.entity.Season;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityGroupRepository extends JpaRepository<ActivityGroup, Long> {

    List<ActivityGroup> findBySeasonId(Long seasonId);

    List<ActivityGroup> findBySeasonIdAndActivityId(Long seasonId, Long activityId);

    List<ActivityGroup> findBySeasonIdAndIsActive(Long seasonId, Boolean isActive);

    boolean existsBySeasonAndActivityAndName(Season season, Activity activity, String name);

    boolean existsBySeasonAndActivityAndNameAndIdNot(
            Season season,
            Activity activity,
            String name,
            Long id
    );
}
