package com.sportmanager.service;

import com.sportmanager.dto.request.ActivityGroupRequest;
import com.sportmanager.dto.request.ActivityGroupUpdateRequest;
import com.sportmanager.dto.request.GroupTrainingSessionRequest;
import com.sportmanager.dto.response.ActivityGroupResponse;
import com.sportmanager.dto.response.GroupTrainingSessionResponse;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityGroup;
import com.sportmanager.entity.GroupTrainingSession;
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
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
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
    private final ObjectProvider<PaymentService> paymentServiceProvider;

    @Transactional
    public ActivityGroupResponse createGroup(ActivityGroupRequest request) {
        Season season = getSeason(request.getSeasonId());
        Activity activity = getActivity(request.getActivityType());
        Integer weeklySessions = request.getWeeklySessions();
        if (request.getActivityType() == ActivityType.FOOTBALL) {
            weeklySessions = resolveFootballWeeklySessionsFromSlots(
                    request.getIsActive(),
                    request.getTrainingSessions()
            );
        }
        validateGroupAttributes(
                request.getActivityType(),
                request.getAgeGroups(),
                request.getSwimmingLessonType(),
                request.getWaterAdaptationLevel(),
                weeklySessions
        );
        validateNameAvailable(season, activity, request.getName(), null);
        if (request.getActivityType() == ActivityType.FOOTBALL) {
            validateFootballTrainingSessions(
                    request.getIsActive(),
                    weeklySessions,
                    request.getTrainingSessions()
            );
            validateNoOverlappingFootballAgeGroups(
                    season,
                    activity,
                    request.getAgeGroups(),
                    request.getIsActive(),
                    null
            );
        } else if (request.getActivityType() == ActivityType.SWIMMING) {
            validateSwimmingTrainingSessions(
                    request.getIsActive(),
                    weeklySessions,
                    request.getTrainingSessions()
            );
        }

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
                weeklySessions
        );
        replaceTrainingSessions(group, request.getActivityType(), request.getTrainingSessions());

        return toResponse(activityGroupRepository.save(group));
    }

    @Transactional
    public ActivityGroupResponse updateGroup(Long groupId, ActivityGroupUpdateRequest request) {
        ActivityGroup group = getGroupEntity(groupId);
        ActivityType activityType = group.getActivity().getActivityType();

        Integer weeklySessions = request.getWeeklySessions();
        if (activityType == ActivityType.FOOTBALL) {
            weeklySessions = resolveFootballWeeklySessionsFromSlots(
                    request.getIsActive(),
                    request.getTrainingSessions()
            );
        }
        validateGroupAttributes(
                activityType,
                request.getAgeGroups(),
                request.getSwimmingLessonType(),
                request.getWaterAdaptationLevel(),
                weeklySessions
        );
        validateNameAvailable(
                group.getSeason(),
                group.getActivity(),
                request.getName(),
                groupId
        );
        if (activityType == ActivityType.FOOTBALL) {
            validateFootballTrainingSessions(
                    request.getIsActive(),
                    weeklySessions,
                    request.getTrainingSessions()
            );
            validateNoOverlappingFootballAgeGroups(
                    group.getSeason(),
                    group.getActivity(),
                    request.getAgeGroups(),
                    request.getIsActive(),
                    groupId
            );
        } else if (activityType == ActivityType.SWIMMING) {
            validateSwimmingTrainingSessions(
                    request.getIsActive(),
                    weeklySessions,
                    request.getTrainingSessions()
            );
        }

        group.setName(request.getName().trim());
        group.setIsActive(request.getIsActive());
        applyTypeSpecificAttributes(
                group,
                activityType,
                request.getAgeGroups(),
                request.getSwimmingLessonType(),
                request.getWaterAdaptationLevel(),
                weeklySessions
        );
        replaceTrainingSessions(group, activityType, request.getTrainingSessions());

        ActivityGroupResponse response = toResponse(activityGroupRepository.save(group));
        if (activityType == ActivityType.SWIMMING) {
            paymentServiceProvider.getObject()
                    .recalculatePendingMonthlyPaymentsForGroup(group);
        }
        return response;
    }

    @Transactional
    public ActivityGroupResponse getGroupById(Long groupId) {
        ActivityGroup group = getGroupEntity(groupId);
        if (healStaleFootballWeeklySessions(group)) {
            group = activityGroupRepository.save(group);
        }
        return toResponse(group);
    }

    @Transactional
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

        return groups.stream()
                .map(group -> {
                    if (healStaleFootballWeeklySessions(group)) {
                        return toResponse(activityGroupRepository.save(group));
                    }
                    return toResponse(group);
                })
                .toList();
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
        Registration saved = registrationRepository.save(registration);
        if (group.getActivity().getActivityType() == ActivityType.SWIMMING
                && saved.getStatus() == RegistrationStatus.APPROVED) {
            paymentServiceProvider.getObject().ensureOrUpdatePendingMonthlyPayment(saved);
        }
        return registrationService.toResponse(saved);
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
        if (group.getActivity().getActivityType() == ActivityType.FOOTBALL) {
            List<GroupTrainingSessionRequest> sessionRequests = group.getTrainingSessions().stream()
                    .map(this::toSessionRequest)
                    .toList();
            Integer weeklySessions = resolveFootballWeeklySessionsFromSlots(true, sessionRequests);
            group.setWeeklySessions(weeklySessions);
            validateFootballTrainingSessions(true, weeklySessions, sessionRequests);
            validateNoOverlappingFootballAgeGroups(
                    group.getSeason(),
                    group.getActivity(),
                    group.getAgeGroups(),
                    true,
                    group.getId()
            );
        } else if (group.getActivity().getActivityType() == ActivityType.SWIMMING) {
            List<GroupTrainingSessionRequest> sessionRequests = group.getTrainingSessions().stream()
                    .map(this::toSessionRequest)
                    .toList();
            validateSwimmingTrainingSessions(true, group.getWeeklySessions(), sessionRequests);
        }
        group.setIsActive(true);
        return toResponse(activityGroupRepository.save(group));
    }

    @Transactional
    public ActivityGroupResponse deactivateGroup(Long groupId) {
        ActivityGroup group = getGroupEntity(groupId);
        group.setIsActive(false);
        return toResponse(activityGroupRepository.save(group));
    }

    /**
     * Permanently deletes a group. Assigned registrations are unassigned first
     * (activity_group_id set to null); training sessions are removed via cascade.
     */
    @Transactional
    public void deleteGroup(Long groupId) {
        ActivityGroup group = getGroupEntity(groupId);
        List<Registration> members = registrationRepository.findByActivityGroupId(groupId);
        for (Registration registration : members) {
            registration.setActivityGroup(null);
        }
        registrationRepository.saveAll(members);
        activityGroupRepository.delete(group);
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
            // Show every approved, unassigned swimming registration for this season/activity.
            // Admin chooses the group; capacity is still enforced on assign.
            // (Do not match on pricing.weeklySessions — that field is the unit-price key = 1.)
            return true;
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

    /**
     * Football weeklySessions is derived from the number of active training slots (1 or 2).
     */
    private Integer resolveFootballWeeklySessionsFromSlots(
            Boolean isActive,
            List<GroupTrainingSessionRequest> trainingSessions
    ) {
        List<GroupTrainingSessionRequest> sessions =
                trainingSessions == null ? List.of() : trainingSessions;
        long activeCount = sessions.stream()
                .filter(session -> Boolean.TRUE.equals(session.getIsActive()))
                .count();

        if (activeCount > 2) {
            throw new BusinessRuleException(
                    "Football groups support at most 2 active training sessions per week"
            );
        }
        if (Boolean.TRUE.equals(isActive)) {
            if (activeCount != 1 && activeCount != 2) {
                throw new BusinessRuleException(
                        "An active football group requires exactly 1 or 2 active training sessions"
                );
            }
            return (int) activeCount;
        }
        if (activeCount == 1 || activeCount == 2) {
            return (int) activeCount;
        }
        // Inactive group with no slots yet — keep a valid placeholder until schedule is set.
        return 1;
    }

    private void validateFootballTrainingSessions(
            Boolean isActive,
            Integer weeklySessions,
            List<GroupTrainingSessionRequest> trainingSessions
    ) {
        List<GroupTrainingSessionRequest> sessions =
                trainingSessions == null ? List.of() : trainingSessions;

        for (GroupTrainingSessionRequest session : sessions) {
            if (session.getDayOfWeek() == null || session.getStartTime() == null) {
                throw new BusinessRuleException(
                        "Each training session requires a day of week and start time"
                );
            }
            if (session.getIsActive() == null) {
                throw new BusinessRuleException("Each training session requires isActive");
            }
        }

        Set<String> seen = new HashSet<>();
        for (GroupTrainingSessionRequest session : sessions) {
            String key = session.getDayOfWeek() + "|" + session.getStartTime();
            if (!seen.add(key)) {
                throw new BusinessRuleException(
                        "duplicate training day and start time are not allowed in the same group"
                );
            }
        }

        long activeCount = sessions.stream()
                .filter(session -> Boolean.TRUE.equals(session.getIsActive()))
                .count();

        if (Boolean.TRUE.equals(isActive) && (activeCount != 1 && activeCount != 2)) {
            throw new BusinessRuleException(
                    "An active football group requires exactly 1 or 2 active training sessions"
            );
        }

        if (weeklySessions != null
                && activeCount > 0
                && activeCount != weeklySessions.longValue()) {
            throw new BusinessRuleException(
                    "Football group weeklySessions must match the number of active training sessions"
            );
        }
    }

    private void validateNoOverlappingFootballAgeGroups(
            Season season,
            Activity activity,
            Set<AgeGroup> ageGroups,
            Boolean isActive,
            Long excludeGroupId
    ) {
        if (!Boolean.TRUE.equals(isActive)) {
            return;
        }
        Set<AgeGroup> requested = normalizeAgeGroups(ageGroups);
        if (requested.isEmpty()) {
            return;
        }

        List<ActivityGroup> existing = activityGroupRepository
                .findBySeasonIdAndActivityId(season.getId(), activity.getId());

        for (ActivityGroup other : existing) {
            if (excludeGroupId != null && Objects.equals(other.getId(), excludeGroupId)) {
                continue;
            }
            if (!Boolean.TRUE.equals(other.getIsActive())) {
                continue;
            }
            Set<AgeGroup> otherAges = other.getAgeGroups() == null
                    ? Set.of()
                    : other.getAgeGroups();
            for (AgeGroup ageGroup : requested) {
                if (otherAges.contains(ageGroup)) {
                    throw new BusinessRuleException(
                            "Age group " + ageGroup
                                    + " is already used by another active football group in this season"
                    );
                }
            }
        }
    }

    private void validateSwimmingTrainingSessions(
            Boolean isActive,
            Integer weeklySessions,
            List<GroupTrainingSessionRequest> trainingSessions
    ) {
        List<GroupTrainingSessionRequest> sessions =
                trainingSessions == null ? List.of() : trainingSessions;

        for (GroupTrainingSessionRequest session : sessions) {
            if (session.getDayOfWeek() == null || session.getStartTime() == null) {
                throw new BusinessRuleException(
                        "Each training session requires a day of week and start time"
                );
            }
            if (session.getIsActive() == null) {
                throw new BusinessRuleException("Each training session requires isActive");
            }
        }

        Set<String> seen = new HashSet<>();
        for (GroupTrainingSessionRequest session : sessions) {
            String key = session.getDayOfWeek() + "|" + session.getStartTime();
            if (!seen.add(key)) {
                throw new BusinessRuleException(
                        "duplicate training day and start time are not allowed in the same group"
                );
            }
        }

        long activeCount = sessions.stream()
                .filter(session -> Boolean.TRUE.equals(session.getIsActive()))
                .count();

        if (Boolean.TRUE.equals(isActive)) {
            if (weeklySessions == null || weeklySessions < 1 || weeklySessions > 6) {
                throw new BusinessRuleException(
                        "Swimming weeklySessions must be between 1 and 6"
                );
            }
            if (activeCount != weeklySessions.longValue()) {
                throw new BusinessRuleException(
                        "An active swimming group requires exactly "
                                + weeklySessions
                                + " active training session(s) matching weeklySessions"
                );
            }
        } else if (weeklySessions != null
                && activeCount > 0
                && activeCount != weeklySessions.longValue()) {
            throw new BusinessRuleException(
                    "Swimming group weeklySessions must match the number of active training sessions"
            );
        }
    }

    private void replaceTrainingSessions(
            ActivityGroup group,
            ActivityType activityType,
            List<GroupTrainingSessionRequest> trainingSessions
    ) {
        if (group.getTrainingSessions() == null) {
            group.setTrainingSessions(new ArrayList<>());
        }
        group.getTrainingSessions().clear();

        if ((activityType != ActivityType.FOOTBALL && activityType != ActivityType.SWIMMING)
                || trainingSessions == null
                || trainingSessions.isEmpty()) {
            return;
        }

        for (GroupTrainingSessionRequest request : trainingSessions) {
            GroupTrainingSession session = new GroupTrainingSession();
            session.setActivityGroup(group);
            session.setDayOfWeek(request.getDayOfWeek());
            session.setStartTime(request.getStartTime());
            session.setEndTime(request.getEndTime());
            session.setIsActive(Boolean.TRUE.equals(request.getIsActive()));
            group.getTrainingSessions().add(session);
        }
    }

    private GroupTrainingSessionRequest toSessionRequest(GroupTrainingSession session) {
        GroupTrainingSessionRequest request = new GroupTrainingSessionRequest();
        request.setId(session.getId());
        request.setDayOfWeek(session.getDayOfWeek());
        request.setStartTime(session.getStartTime());
        request.setEndTime(session.getEndTime());
        request.setIsActive(session.getIsActive());
        return request;
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
        int memberCount = group.getId() == null
                ? 0
                : registrationRepository.findByActivityGroupId(group.getId()).size();
        ActivityType activityType = group.getActivity().getActivityType();

        List<GroupTrainingSessionResponse> sessions =
                group.getTrainingSessions() == null
                        ? List.of()
                        : group.getTrainingSessions().stream()
                                .map(session -> GroupTrainingSessionResponse.builder()
                                        .id(session.getId())
                                        .dayOfWeek(session.getDayOfWeek())
                                        .startTime(session.getStartTime())
                                        .endTime(session.getEndTime())
                                        .isActive(session.getIsActive())
                                        .build())
                                .toList();

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
                .weeklySessions(resolveDisplayedWeeklySessions(activityType, group))
                .isActive(group.getIsActive())
                .memberCount(memberCount)
                .maxCapacity(resolveMaxCapacity(activityType, group.getSwimmingLessonType()))
                .trainingSessions(sessions)
                .build();
    }

    /**
     * Football weeklySessions in API responses follows active training slots,
     * so a stale column value cannot hide a 2-session schedule.
     */
    private Integer resolveDisplayedWeeklySessions(
            ActivityType activityType,
            ActivityGroup group
    ) {
        if (activityType != ActivityType.FOOTBALL) {
            return group.getWeeklySessions();
        }
        long activeCount = countActiveTrainingSessions(group);
        if (activeCount == 1 || activeCount == 2) {
            return (int) activeCount;
        }
        return group.getWeeklySessions();
    }

    /** Persists weeklySessions when it no longer matches active training slots. */
    private boolean healStaleFootballWeeklySessions(ActivityGroup group) {
        if (group.getActivity().getActivityType() != ActivityType.FOOTBALL) {
            return false;
        }
        long activeCount = countActiveTrainingSessions(group);
        if (activeCount != 1 && activeCount != 2) {
            return false;
        }
        int derived = (int) activeCount;
        if (Objects.equals(group.getWeeklySessions(), derived)) {
            return false;
        }
        group.setWeeklySessions(derived);
        return true;
    }

    private long countActiveTrainingSessions(ActivityGroup group) {
        if (group.getTrainingSessions() == null) {
            return 0;
        }
        return group.getTrainingSessions().stream()
                .filter(session -> Boolean.TRUE.equals(session.getIsActive()))
                .count();
    }
}
