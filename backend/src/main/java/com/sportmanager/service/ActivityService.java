package com.sportmanager.service;

import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.exception.ConflictException;

import com.sportmanager.dto.request.ActivityRequest;
import com.sportmanager.entity.Activity;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;

    @Transactional
    public Activity createActivity(ActivityRequest request) {

        validateActivityTypeDoesNotExist(
                request.getActivityType()
        );

        Activity activity = new Activity();

        activity.setActivityType(request.getActivityType());
        activity.setIsActive(request.getIsActive());

        return activityRepository.save(activity);
    }

    @Transactional(readOnly = true)
    public List<Activity> getAllActivities() {
        return activityRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Activity> getActiveActivities() {
        return activityRepository.findByIsActive(true);
    }

    @Transactional(readOnly = true)
    public Activity getActivityById(Long activityId) {
        return activityRepository.findById(activityId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Activity was not found with id: "
                                        + activityId
                        )
                );
    }

    @Transactional(readOnly = true)
    public Activity getActivityByType(
            ActivityType activityType
    ) {
        return activityRepository
                .findByActivityType(activityType)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Activity was not found with type: "
                                        + activityType
                        )
                );
    }

    @Transactional
    public Activity updateActivity(
            Long activityId,
            ActivityRequest request
    ) {
        Activity activity = getActivityById(activityId);

        validateActivityTypeIsAvailable(
                request.getActivityType(),
                activityId
        );

        activity.setActivityType(request.getActivityType());
        activity.setIsActive(request.getIsActive());

        return activityRepository.save(activity);
    }

    @Transactional
    public Activity activateActivity(Long activityId) {

        Activity activity = getActivityById(activityId);

        activity.setIsActive(true);

        return activityRepository.save(activity);
    }

    @Transactional
    public Activity deactivateActivity(Long activityId) {

        Activity activity = getActivityById(activityId);

        activity.setIsActive(false);

        return activityRepository.save(activity);
    }

    private void validateActivityTypeDoesNotExist(
            ActivityType activityType
    ) {
        if (activityRepository.existsByActivityType(activityType)) {
            throw new ConflictException(
                    "An activity already exists with type: "
                            + activityType
            );
        }
    }

    private void validateActivityTypeIsAvailable(
            ActivityType activityType,
            Long activityId
    ) {
        boolean activityTypeExists =
                activityRepository
                        .existsByActivityTypeAndIdNot(
                                activityType,
                                activityId
                        );

        if (activityTypeExists) {
            throw new ConflictException(
                    "Another activity already exists with type: "
                            + activityType
            );
        }
    }
}