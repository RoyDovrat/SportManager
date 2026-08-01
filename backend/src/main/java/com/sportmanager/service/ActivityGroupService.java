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
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
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

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

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
        validateGroupAttributes(
                request.getActivityType(),
                request.getAgeGroups(),
                request.getSwimmingLessonType(),
                request.getWaterAdaptationLevel(),
                request.getWeeklySessions()
        );
        validateNameAvailable(season, activity, request.getName(), null);

        ActivityGroup group = new ActivityGroup();
        group.setName(request.getName().trim());
        group.setSeason(season);
        group.setActivity(activity);
        group.setIsActive(request.getIsActive());
        applyTypeSpecificAttributes(
                group,
                request.getActivityType(),
                request.getAgeGroups(),
                request.getSwimmingLessonType(),
                request.getWaterAdaptationLevel(),
                request.getWeeklySessions()
        );

        return toResponse(activityGroupRepository.save(group));
    }

    @Transactional
    public ActivityGroupResponse updateGroup(Long groupId, ActivityGroupUpdateRequest request) {
        ActivityGroup group = getGroupEntity(groupId);
        ActivityType activityType = group.getActivity().getActivityType();

        validateGroupAttributes(
                activityType,
                request.getAgeGroups(),
                request.getSwimmingLessonType(),
                request.getWaterAdaptationLevel(),
                request.getWeeklySessions()
        );
        validateNameAvailable(
                group.getSeason(),
                group.getActivity(),
                request.getName(),
                groupId
        );

        group.setName(request.getName().trim());
        group.setIsActive(request.getIsActive());
        applyTypeSpecificAttributes(
                group,
                activityType,
                request.getAgeGroups(),
                request.getSwimmingLessonType(),
                request.getWaterAdaptationLevel(),
                request.getWeeklySessions()
        );

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

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getEligibleRegistrations(Long groupId) {
        ActivityGroup group = getGroupEntity(groupId);
        Long seasonId = group.getSeason().getId();
        Long activityId = group.getActivity().getId();

        return registrationRepository.findBySeasonIdAndStatus(seasonId, RegistrationStatus.APPROVED)
                .stream()
                .filter(registration -> Objects.equals(registration.getActivity().getId(), activityId))
                .filter(registration -> registration.getActivityGroup() == null)
                .filter(registration -> isEligibleForGroup(registration, group))
                .map(registrationService::toResponse)
                .toList();
    }

    @Transactional
    public RegistrationResponse assignRegistrationToGroup(Long registrationId, Long groupId) {
        Registration registration = registrationService.getRegistrationEntity(registrationId);
        ActivityGroup group = getGroupEntity(groupId);

        validateCanAssign(registration, group);
        validateHasCapacity(group);
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
        if (!isEligibleForGroup(registration, group)) {
            throw new BusinessRuleException(
                    "Registration does not match the activity group rules"
            );
        }
    }

    private boolean isEligibleForGroup(Registration registration, ActivityGroup group) {
        ActivityType activityType = group.getActivity().getActivityType();

        if (activityType == ActivityType.FOOTBALL) {
            Set<AgeGroup> allowed = group.getAgeGroups();
            if (allowed == null || allowed.isEmpty()) {
                return false;
            }
            return allowed.contains(registration.getStudent().getAgeGroup());
        }

        if (activityType == ActivityType.SWIMMING) {
            Set<AgeGroup> allowed = group.getAgeGroups();
            Integer registrationWeeklySessions = registration.getActivityPricing() != null
                    ? registration.getActivityPricing().getWeeklySessions()
                    : null;
            if (group.getSwimmingLessonType() == null
                    || group.getWaterAdaptationLevel() == null
                    || group.getWeeklySessions() == null
                    || allowed == null
                    || allowed.isEmpty()
                    || registrationWeeklySessions == null) {
                return false;
            }
            return group.getSwimmingLessonType() == registration.getSwimmingLessonType()
                    && group.getWaterAdaptationLevel() == registration.getWaterAdaptationLevel()
                    && Objects.equals(group.getWeeklySessions(), registrationWeeklySessions)
                    && allowed.contains(registration.getStudent().getAgeGroup());
        }

        return false;
    }

    private void validateHasCapacity(ActivityGroup group) {
        Integer maxCapacity = resolveMaxCapacity(group.getActivity().getActivityType(),
                group.getSwimmingLessonType());
        if (maxCapacity == null) {
            return;
        }
        int memberCount = registrationRepository.findByActivityGroupId(group.getId()).size();
        if (memberCount >= maxCapacity) {
            throw new BusinessRuleException(
                    "This swimming lesson is full (max " + maxCapacity + " participants)"
            );
        }
    }

    private Integer resolveMaxCapacity(ActivityType activityType, SwimmingLessonType lessonType) {
        if (activityType != ActivityType.SWIMMING || lessonType == null) {
            return null;
        }
        return switch (lessonType) {
            case PRIVATE -> 1;
            case PAIR -> 2;
            case GROUP -> 5;
        };
    }

    private void validateGroupAttributes(
            ActivityType activityType,
            Set<AgeGroup> ageGroups,
            SwimmingLessonType swimmingLessonType,
            WaterAdaptationLevel waterAdaptationLevel,
            Integer weeklySessions
    ) {
        Set<AgeGroup> normalizedAgeGroups = normalizeAgeGroups(ageGroups);

        if (activityType == ActivityType.FOOTBALL) {
            if (normalizedAgeGroups.isEmpty()) {
                throw new BusinessRuleException(
                        "At least one age group is required for football groups"
                );
            }
            if (swimmingLessonType != null || waterAdaptationLevel != null) {
                throw new BusinessRuleException(
                        "Swimming attributes must not be provided for football groups"
                );
            }
            if (weeklySessions == null || (weeklySessions != 1 && weeklySessions != 2)) {
                throw new BusinessRuleException(
                        "Football groups require weeklySessions of 1 or 2"
                );
            }
            return;
        }

        if (activityType == ActivityType.SWIMMING) {
            if (swimmingLessonType == null) {
                throw new BusinessRuleException(
                        "Swimming lesson type is required for swimming groups"
                );
            }
            if (normalizedAgeGroups.isEmpty()) {
                throw new BusinessRuleException(
                        "At least one age group is required for swimming groups"
                );
            }
            if (waterAdaptationLevel == null) {
                throw new BusinessRuleException(
                        "Water adaptation level is required for swimming groups"
                );
            }
            if (weeklySessions == null || weeklySessions < 1 || weeklySessions > 6) {
                throw new BusinessRuleException(
                        "Swimming groups require weeklySessions between 1 and 6"
                );
            }
            return;
        }

        throw new BusinessRuleException("Unsupported activity type");
    }

    private void applyTypeSpecificAttributes(
            ActivityGroup group,
            ActivityType activityType,
            Set<AgeGroup> ageGroups,
            SwimmingLessonType swimmingLessonType,
            WaterAdaptationLevel waterAdaptationLevel,
            Integer weeklySessions
    ) {
        Set<AgeGroup> normalizedAgeGroups = normalizeAgeGroups(ageGroups);

        if (activityType == ActivityType.FOOTBALL) {
            group.setAgeGroups(normalizedAgeGroups);
            group.setSwimmingLessonType(null);
            group.setWaterAdaptationLevel(null);
            group.setWeeklySessions(weeklySessions);
        } else {
            group.setAgeGroups(normalizedAgeGroups);
            group.setSwimmingLessonType(swimmingLessonType);
            group.setWaterAdaptationLevel(waterAdaptationLevel);
            group.setWeeklySessions(weeklySessions);
        }
    }

    private Set<AgeGroup> normalizeAgeGroups(Set<AgeGroup> ageGroups) {
        if (ageGroups == null || ageGroups.isEmpty()) {
            return new HashSet<>();
        }
        return new HashSet<>(ageGroups);
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
        ActivityType activityType = group.getActivity().getActivityType();

        return ActivityGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .seasonId(group.getSeason().getId())
                .seasonName(group.getSeason().getName())
                .activityId(group.getActivity().getId())
                .activityType(activityType)
                .ageGroups(group.getAgeGroups() == null
                        ? Set.of()
                        : Set.copyOf(group.getAgeGroups()))
                .swimmingLessonType(group.getSwimmingLessonType())
                .waterAdaptationLevel(group.getWaterAdaptationLevel())
                .weeklySessions(group.getWeeklySessions())
                .isActive(group.getIsActive())
                .memberCount(memberCount)
                .maxCapacity(resolveMaxCapacity(activityType, group.getSwimmingLessonType()))
                .build();
    }
}
