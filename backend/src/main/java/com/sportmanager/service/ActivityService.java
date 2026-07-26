package com.sportmanager.service;

import com.sportmanager.dto.request.ActivityRequest;
import com.sportmanager.dto.response.ActivityResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
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
    public ActivityResponse createActivity(ActivityRequest request) {
        validateActivityTypeDoesNotExist(request.getActivityType());

        Activity activity = new Activity();
        activity.setActivityType(request.getActivityType());
        activity.setIsActive(request.getIsActive());

        return toResponse(activityRepository.save(activity));
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getAllActivities() {
        return activityRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getActiveActivities() {
        return activityRepository.findByIsActive(true).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivityById(Long activityId) {
        return toResponse(getActivityEntity(activityId));
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivityByType(ActivityType activityType) {
        Activity activity = activityRepository
                .findByActivityType(activityType)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Activity was not found with type: " + activityType
                ));
        return toResponse(activity);
    }

    @Transactional
    public ActivityResponse updateActivity(Long activityId, ActivityRequest request) {
        Activity activity = getActivityEntity(activityId);

        validateActivityTypeIsAvailable(request.getActivityType(), activityId);

        activity.setActivityType(request.getActivityType());
        activity.setIsActive(request.getIsActive());

        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    public ActivityResponse activateActivity(Long activityId) {
        Activity activity = getActivityEntity(activityId);
        activity.setIsActive(true);
        return toResponse(activityRepository.save(activity));
    }

    @Transactional
    public ActivityResponse deactivateActivity(Long activityId) {
        Activity activity = getActivityEntity(activityId);
        activity.setIsActive(false);
        return toResponse(activityRepository.save(activity));
    }

    private Activity getActivityEntity(Long activityId) {
        return activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Activity was not found with id: " + activityId
                ));
    }

    private void validateActivityTypeDoesNotExist(ActivityType activityType) {
        if (activityRepository.existsByActivityType(activityType)) {
            throw new ConflictException(
                    "An activity already exists with type: " + activityType
            );
        }
    }

    private void validateActivityTypeIsAvailable(ActivityType activityType, Long activityId) {
        boolean activityTypeExists = activityRepository
                .existsByActivityTypeAndIdNot(activityType, activityId);

        if (activityTypeExists) {
            throw new ConflictException(
                    "Another activity already exists with type: " + activityType
            );
        }
    }

    private ActivityResponse toResponse(Activity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .activityType(activity.getActivityType())
                .isActive(activity.getIsActive())
                .build();
    }
}
