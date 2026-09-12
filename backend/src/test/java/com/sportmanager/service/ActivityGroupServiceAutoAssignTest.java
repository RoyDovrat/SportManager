package com.sportmanager.service;

import com.sportmanager.dto.request.ActivityGroupRequest;
import com.sportmanager.dto.request.GroupTrainingSessionRequest;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityGroup;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import com.sportmanager.repository.ActivityGroupRepository;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityGroupServiceAutoAssignTest {

    @Mock
    private ActivityGroupRepository activityGroupRepository;
    @Mock
    private SeasonRepository seasonRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private RegistrationService registrationService;
    @Mock
    private ObjectProvider<PaymentService> paymentServiceProvider;
    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private ActivityGroupService activityGroupService;

    private Season season;
    private Activity swimming;

    @BeforeEach
    void setUp() {
        season = new Season();
        season.setId(1L);
        season.setName("2026-2027");

        swimming = new Activity();
        swimming.setId(3L);
        swimming.setActivityType(ActivityType.SWIMMING);
        swimming.setIsActive(true);

        lenient().when(paymentServiceProvider.getObject()).thenReturn(paymentService);
    }

    @Test
    void createSwimmingGroup_doesNotAutoAssign() {
        stubLookups();
        when(activityGroupRepository.save(any(ActivityGroup.class))).thenAnswer(inv -> {
            ActivityGroup group = inv.getArgument(0);
            group.setId(40L);
            return group;
        });

        activityGroupService.createGroup(baseSwimmingRequest());

        verify(registrationRepository, never()).save(any(Registration.class));
        verify(registrationRepository, never()).findBySeasonId(any());
    }

    @Test
    void createSwimmingGroup_acceptsLegacySingleWaterLevel() {
        stubLookups();
        when(activityGroupRepository.save(any(ActivityGroup.class))).thenAnswer(inv -> {
            ActivityGroup group = inv.getArgument(0);
            group.setId(40L);
            return group;
        });

        ActivityGroupRequest request = baseSwimmingRequest();
        request.setWaterAdaptationLevels(null);
        request.setWaterAdaptationLevel(WaterAdaptationLevel.BASIC_SWIMMING);

        activityGroupService.createGroup(request);

        ArgumentCaptor<ActivityGroup> captor = ArgumentCaptor.forClass(ActivityGroup.class);
        verify(activityGroupRepository).save(captor.capture());
        assertThat(captor.getValue().getWaterAdaptationLevels())
                .containsExactly(WaterAdaptationLevel.BASIC_SWIMMING);
    }

    @Test
    void createSwimmingGroup_persistsMultipleWaterLevels() {
        stubLookups();
        when(activityGroupRepository.save(any(ActivityGroup.class))).thenAnswer(inv -> {
            ActivityGroup group = inv.getArgument(0);
            group.setId(40L);
            return group;
        });

        ActivityGroupRequest request = baseSwimmingRequest();
        request.setWaterAdaptationLevels(Set.of(
                WaterAdaptationLevel.NOT_INDEPENDENT,
                WaterAdaptationLevel.BASIC_SWIMMING
        ));

        activityGroupService.createGroup(request);

        ArgumentCaptor<ActivityGroup> captor = ArgumentCaptor.forClass(ActivityGroup.class);
        verify(activityGroupRepository).save(captor.capture());
        assertThat(captor.getValue().getWaterAdaptationLevels()).containsExactlyInAnyOrder(
                WaterAdaptationLevel.NOT_INDEPENDENT,
                WaterAdaptationLevel.BASIC_SWIMMING
        );
    }

    @Test
    void getEligibleRegistrations_swimmingIncludesUnmatchedApproved() {
        ActivityGroup group = savedSwimmingGroup();
        Registration matching = swimmingRegistration(20L, AgeGroup.GRADE_1, SwimmingLessonType.GROUP, 2);
        Registration otherLesson = swimmingRegistration(21L, AgeGroup.GRADE_2, SwimmingLessonType.PRIVATE, 1);
        when(activityGroupRepository.findById(40L)).thenReturn(Optional.of(group));
        when(registrationRepository.findBySeasonIdAndStatus(1L, RegistrationStatus.APPROVED))
                .thenReturn(List.of(matching, otherLesson));
        when(registrationService.toResponse(any(Registration.class))).thenAnswer(inv -> {
            Registration registration = inv.getArgument(0);
            return RegistrationResponse.builder().id(registration.getId()).build();
        });

        List<RegistrationResponse> eligible = activityGroupService.getEligibleRegistrations(40L);

        assertThat(eligible).extracting(RegistrationResponse::getId).containsExactlyInAnyOrder(20L, 21L);
    }

    @Test
    void assignSwimming_allowsCharacterizationMismatch() {
        ActivityGroup group = savedSwimmingGroup();
        Registration otherLesson = swimmingRegistration(21L, AgeGroup.GRADE_2, SwimmingLessonType.PRIVATE, 1);
        when(activityGroupRepository.findById(40L)).thenReturn(Optional.of(group));
        when(registrationService.getRegistrationEntity(21L)).thenReturn(otherLesson);
        when(registrationRepository.findByActivityGroupId(40L)).thenReturn(new ArrayList<>());
        when(registrationRepository.save(any(Registration.class))).thenAnswer(inv -> inv.getArgument(0));
        when(registrationService.toResponse(any(Registration.class))).thenAnswer(inv -> {
            Registration registration = inv.getArgument(0);
            return RegistrationResponse.builder().id(registration.getId()).build();
        });

        activityGroupService.assignRegistrationToGroup(21L, 40L);

        assertThat(otherLesson.getActivityGroup()).isSameAs(group);
        verify(registrationRepository).save(otherLesson);
    }

    private void stubLookups() {
        when(seasonRepository.findById(1L)).thenReturn(Optional.of(season));
        when(activityRepository.findByActivityType(ActivityType.SWIMMING))
                .thenReturn(Optional.of(swimming));
        lenient().when(activityGroupRepository.existsBySeasonAndActivityAndName(any(), any(), any()))
                .thenReturn(false);
    }

    private ActivityGroup savedSwimmingGroup() {
        ActivityGroup group = new ActivityGroup();
        group.setId(40L);
        group.setName("קבוצת שחייה");
        group.setSeason(season);
        group.setActivity(swimming);
        group.setAgeGroups(Set.of(AgeGroup.GRADE_1));
        group.setSwimmingLessonType(SwimmingLessonType.GROUP);
        group.setWaterAdaptationLevels(Set.of(WaterAdaptationLevel.NOT_INDEPENDENT));
        group.setWeeklySessions(2);
        group.setIsActive(true);
        return group;
    }

    private Registration swimmingRegistration(
            Long id,
            AgeGroup ageGroup,
            SwimmingLessonType lessonType,
            int weeklySessions
    ) {
        Student student = new Student();
        student.setId(id);
        student.setAgeGroup(ageGroup);
        student.setFirstName("Kid");
        student.setLastName(String.valueOf(id));

        Registration registration = new Registration();
        registration.setId(id);
        registration.setStudent(student);
        registration.setActivity(swimming);
        registration.setSeason(season);
        registration.setStatus(RegistrationStatus.APPROVED);
        registration.setSwimmingLessonType(lessonType);
        registration.setWaterAdaptationLevel(WaterAdaptationLevel.NOT_INDEPENDENT);
        registration.setWeeklySessions(weeklySessions);
        return registration;
    }

    private static ActivityGroupRequest baseSwimmingRequest() {
        ActivityGroupRequest request = new ActivityGroupRequest();
        request.setName("קבוצת שחייה");
        request.setSeasonId(1L);
        request.setActivityType(ActivityType.SWIMMING);
        request.setAgeGroups(Set.of(AgeGroup.GRADE_1));
        request.setSwimmingLessonType(SwimmingLessonType.GROUP);
        request.setWaterAdaptationLevels(Set.of(WaterAdaptationLevel.NOT_INDEPENDENT));
        request.setWeeklySessions(2);
        request.setIsActive(true);
        request.setTrainingSessions(List.of(
                session(DayOfWeek.SUNDAY, LocalTime.of(17, 0), true),
                session(DayOfWeek.THURSDAY, LocalTime.of(16, 15), true)
        ));
        return request;
    }

    private static GroupTrainingSessionRequest session(
            DayOfWeek day,
            LocalTime start,
            boolean active
    ) {
        GroupTrainingSessionRequest session = new GroupTrainingSessionRequest();
        session.setDayOfWeek(day);
        session.setStartTime(start);
        session.setIsActive(active);
        return session;
    }
}
