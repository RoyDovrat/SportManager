package com.sportmanager.repository;

import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityPricing;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.SwimmingLessonType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActivityPricingRepository extends JpaRepository<ActivityPricing, Long> {

    List<ActivityPricing> findBySeason(Season season);

    List<ActivityPricing> findByActivity(Activity activity);

    Optional<ActivityPricing> findBySeasonAndActivityAndAgeGroup(
            Season season,
            Activity activity,
            AgeGroup ageGroup
    );

    Optional<ActivityPricing> findBySeasonAndActivityAndSwimmingLessonTypeAndWeeklySessions(
            Season season,
            Activity activity,
            SwimmingLessonType swimmingLessonType,
            Integer weeklySessions
    );

    boolean existsBySeasonAndActivityAndAgeGroup(Season season, Activity activity, AgeGroup ageGroup);

    boolean existsBySeasonAndActivityAndSwimmingLessonTypeAndWeeklySessions(
            Season season,
            Activity activity,
            SwimmingLessonType swimmingLessonType,
            Integer weeklySessions
    );
}