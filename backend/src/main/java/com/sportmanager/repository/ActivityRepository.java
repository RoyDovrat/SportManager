package com.sportmanager.repository;

import com.sportmanager.entity.Activity;
import com.sportmanager.enums.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    Optional<Activity> findByActivityType(ActivityType activityType);

}