package com.sportmanager.service;

import com.sportmanager.dto.request.ActivityGroupRequest;
import com.sportmanager.dto.request.ActivityGroupUpdateRequest;
import com.sportmanager.dto.response.ActivityGroupResponse;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityGroup;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ActivityGroupRepository;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ActivityGroupService {

    private final ActivityGroupRepository activityGroupRepository;
    private final SeasonRepository seasonRepository;
    private final ActivityRepository activityRepository;
    private final RegistrationRepository registrationRepository;
    private final RegistrationService registrationService;

    @Transactional
    public ActivityGroupResponse createGroup(ActivityGroupRequest request) {
        Season season = getSeason(request.getSeasonId());
        Activity activity = getActivity(request.getActivityType());
        validateGroupAttributes(request.getActivityType(), request);
        validateNameAvailable(season, activity, request.getName(), null);

        ActivityGroup group = new ActivityGroup();
        group.setName(request.getName().trim());
        group.setSeason(season);
        group.setActivity(activity);
        group.setIsActive(request.getIsActive());
        applyTypeSpecificAttributes(group, request.getActivityType(), request);

        return toResponse(activityGroupRepository.save(group));
    }

    @Transactional
    public ActivityGroupResponse updateGroup(Long groupId, ActivityGroupUpdateRequest request) {
        ActivityGroup group = getGroupEntity(groupId);
        ActivityType activityType = group.getActivity().getActivityType();

        validateGroupAttributes(
                activityType,
                request.getAgeGroup(),
                request.getSwimmingLessonType(),
                request.getWaterAdaptationLevel()
        );
        validateNameAvailable(
                group.getSeason(),
                group.getActivity(),
                request.getName(),
                groupId
        );

        group.setName(request.getName().trim());
        group.setIsActive(request.getIsActive());

        if (activityType == ActivityType.FOOTBALL) {
            group.setAgeGroup(request.getAgeGroup());
            group.setSwimmingLessonType(null);
            group.setWaterAdaptationLevel(null);
        } else {
            group.setAgeGroup(request.getAgeGroup());
            group.setSwimmingLessonType(request.getSwimmingLessonType());
            group.setWaterAdaptationLevel(request.getWaterAdaptationLevel());
        }

        return toResponse(activityGroupRepository.save(group));
    }

    @Transactional(readOnly = true)
    public ActivityGroupResponse getGroupById(Long groupId) {
        return toResponse(getGroupEntity(groupId));
    }

    @Transactional(readOnly = true)
    public List<ActivityGroupResponse> getGroups(Long seasonId, Long activityId, Boolean activeOnly) {
        if (seasonId == null) {
            throw new BusinessRuleException("seasonId query parameter is required");
        }
        getSeason(seasonId);

        List<ActivityGroup> groups;
        if (activityId != null) {
            groups = activityGroupRepository.findBySeasonIdAndActivityId(seasonId, activityId);
        } else if (Boolean.TRUE.equals(activeOnly)) {
            groups = activityGroupRepository.findBySeasonIdAndIsActive(seasonId, true);
        } else {
            groups = activityGroupRepository.findBySeasonId(seasonId);
        }

        if (Boolean.TRUE.equals(activeOnly) && activityId != null) {
            groups = groups.stream()
                    .filter(group -> Boolean.TRUE.equals(group.getIsActive()))
                    .toList();
        }

        return groups.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getGroupRegistrations(Long groupId) {
        getGroupEntity(groupId);
        return registrationRepository.findByActivityGroupId(groupId).stream()
                .map(registrationService::toResponse)
                .toList();
    }

    @Transactional
    public RegistrationResponse assignRegistrationToGroup(Long registrationId, Long groupId) {
        Registration registration = registrationService.getRegistrationEntity(registrationId);
        ActivityGroup group = getGroupEntity(groupId);

        validateCanAssign(registration, group);
        registration.setActivityGroup(group);
        return registrationService.toResponse(registrationRepository.save(registration));
    }

    @Transactional
    public RegistrationResponse unassignRegistrationFromGroup(Long registrationId) {
        Registration registration = registrationService.getRegistrationEntity(registrationId);

        if (registration.getActivityGroup() == null) {
            throw new BusinessRuleException("Registration is not assigned to any group");
        }

        registration.setActivityGroup(null);
        return registrationService.toResponse(registrationRepository.save(registration));
    }

    @Transactional
    public ActivityGroupResponse activateGroup(Long groupId) {
        ActivityGroup group = getGroupEntity(groupId);
        group.setIsActive(true);
        return toResponse(activityGroupRepository.save(group));
    }

    @Transactional
    public ActivityGroupResponse deactivateGroup(Long groupId) {
        ActivityGroup group = getGroupEntity(groupId);
        group.setIsActive(false);
        return toResponse(activityGroupRepository.save(group));
    }

    public ActivityGroup getGroupEntity(Long groupId) {
        return activityGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Activity group was not found with id: " + groupId
                ));
    }

    private void validateCanAssign(Registration registration, ActivityGroup group) {
        if (registration.getStatus() != RegistrationStatus.APPROVED) {
            throw new BusinessRuleException(
                    "Only approved registrations can be assigned to a group"
            );
        }
        if (!Boolean.TRUE.equals(group.getIsActive())) {
            throw new BusinessRuleException("Cannot assign registration to an inactive group");
        }
        if (!Objects.equals(registration.getSeason().getId(), group.getSeason().getId())) {
            throw new BusinessRuleException(
                    "Registration season must match the activity group season"
            );
        }
        if (!Objects.equals(registration.getActivity().getId(), group.getActivity().getId())) {
            throw new BusinessRuleException(
                    "Registration activity must match the activity group activity"
            );
        }

        ActivityType activityType = group.getActivity().getActivityType();
        if (activityType == ActivityType.FOOTBALL) {
            if (group.getAgeGroup() == null) {
                throw new BusinessRuleException("Football groups must have an age group");
            }
            if (registration.getStudent().getAgeGroup() != group.getAgeGroup()) {
                throw new BusinessRuleException(
                        "Student age group must match the football group age group"
                );
            }
            return;
        }

        if (activityType == ActivityType.SWIMMING) {
            if (group.getSwimmingLessonType() != null
                    && registration.getSwimmingLessonType() != group.getSwimmingLessonType()) {
                throw new BusinessRuleException(
                        "Registration swimming lesson type must match the group"
                );
            }
            if (group.getWaterAdaptationLevel() != null
                    && registration.getWaterAdaptationLevel() != group.getWaterAdaptationLevel()) {
                throw new BusinessRuleException(
                        "Registration water adaptation level must match the group"
                );
            }
            if (group.getAgeGroup() != null
                    && registration.getStudent().getAgeGroup() != group.getAgeGroup()) {
                throw new BusinessRuleException(
                        "Student age group must match the swimming group age group"
                );
            }
        }
    }

    private void validateGroupAttributes(ActivityType activityType, ActivityGroupRequest request) {
        validateGroupAttributes(
                activityType,
                request.getAgeGroup(),
                request.getSwimmingLessonType(),
                request.getWaterAdaptationLevel()
        );
    }

    private void validateGroupAttributes(
            ActivityType activityType,
            com.sportmanager.enums.AgeGroup ageGroup,
            com.sportmanager.enums.SwimmingLessonType swimmingLessonType,
            com.sportmanager.enums.WaterAdaptationLevel waterAdaptationLevel
    ) {
        if (activityType == ActivityType.FOOTBALL) {
            if (ageGroup == null) {
                throw new BusinessRuleException("Age group is required for football groups");
            }
            if (swimmingLessonType != null || waterAdaptationLevel != null) {
                throw new BusinessRuleException(
                        "Swimming attributes must not be provided for football groups"
                );
            }
            return;
        }

        if (activityType == ActivityType.SWIMMING) {
            if (swimmingLessonType == null
                    && waterAdaptationLevel == null
                    && ageGroup == null) {
                throw new BusinessRuleException(
                        "Swimming groups require at least one of: swimmingLessonType, waterAdaptationLevel, ageGroup"
                );
            }
            return;
        }

        throw new BusinessRuleException("Unsupported activity type");
    }

    private void applyTypeSpecificAttributes(
            ActivityGroup group,
            ActivityType activityType,
            ActivityGroupRequest request
    ) {
        if (activityType == ActivityType.FOOTBALL) {
            group.setAgeGroup(request.getAgeGroup());
            group.setSwimmingLessonType(null);
            group.setWaterAdaptationLevel(null);
        } else {
            group.setAgeGroup(request.getAgeGroup());
            group.setSwimmingLessonType(request.getSwimmingLessonType());
            group.setWaterAdaptationLevel(request.getWaterAdaptationLevel());
        }
    }

    private void validateNameAvailable(
            Season season,
            Activity activity,
            String name,
            Long excludeId
    ) {
        boolean exists = excludeId == null
                ? activityGroupRepository.existsBySeasonAndActivityAndName(season, activity, name.trim())
                : activityGroupRepository.existsBySeasonAndActivityAndNameAndIdNot(
                        season, activity, name.trim(), excludeId
                );

        if (exists) {
            throw new ConflictException(
                    "An activity group with this name already exists for the season and activity"
            );
        }
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));
    }

    private Activity getActivity(ActivityType activityType) {
        return activityRepository.findByActivityType(activityType)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Activity was not found with type: " + activityType
                ));
    }

    private ActivityGroupResponse toResponse(ActivityGroup group) {
        int memberCount = registrationRepository.findByActivityGroupId(group.getId()).size();

        return ActivityGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .seasonId(group.getSeason().getId())
                .seasonName(group.getSeason().getName())
                .activityId(group.getActivity().getId())
                .activityType(group.getActivity().getActivityType())
                .ageGroup(group.getAgeGroup())
                .swimmingLessonType(group.getSwimmingLessonType())
                .waterAdaptationLevel(group.getWaterAdaptationLevel())
                .isActive(group.getIsActive())
                .memberCount(memberCount)
                .build();
    }
}
