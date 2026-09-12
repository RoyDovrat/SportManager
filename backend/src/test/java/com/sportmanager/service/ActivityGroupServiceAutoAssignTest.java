package com.sportmanager.service;

import com.sportmanager.dto.request.ActivityGroupRequest;
import com.sportmanager.dto.request.GroupTrainingSessionRequest;
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
    void createSwimmingGroup_assignsMatchingUnassignedRegistrations() {
        stubLookups();
        Registration matching = swimmingRegistration(20L, AgeGroup.GRADE_1, SwimmingLessonType.GROUP, 2);
        Registration otherLesson = swimmingRegistration(21L, AgeGroup.GRADE_1, SwimmingLessonType.PRIVATE, 2);
        when(registrationRepository.findBySeasonId(1L)).thenReturn(List.of(matching, otherLesson));
        when(activityGroupRepository.save(any(ActivityGroup.class))).thenAnswer(inv -> {
            ActivityGroup group = inv.getArgument(0);
            group.setId(40L);
            return group;
        });
        when(registrationRepository.findByActivityGroupId(40L)).thenReturn(new ArrayList<>());
        when(registrationRepository.save(any(Registration.class))).thenAnswer(inv -> inv.getArgument(0));

        activityGroupService.createGroup(baseSwimmingRequest());

        ArgumentCaptor<Registration> captor = ArgumentCaptor.forClass(Registration.class);
        verify(registrationRepository).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(20L);
        assertThat(captor.getValue().getActivityGroup().getId()).isEqualTo(40L);
    }

    @Test
    void createSwimmingGroup_respectsPrivateCapacity() {
        stubLookups();
        ActivityGroupRequest request = baseSwimmingRequest();
        request.setSwimmingLessonType(SwimmingLessonType.PRIVATE);
        request.setWeeklySessions(1);
        request.setTrainingSessions(List.of(session(DayOfWeek.SUNDAY, LocalTime.of(17, 0), true)));

        Registration first = swimmingRegistration(20L, AgeGroup.GRADE_1, SwimmingLessonType.PRIVATE, 1);
        Registration second = swimmingRegistration(21L, AgeGroup.GRADE_1, SwimmingLessonType.PRIVATE, 1);
        when(registrationRepository.findBySeasonId(1L)).thenReturn(List.of(first, second));
        when(activityGroupRepository.save(any(ActivityGroup.class))).thenAnswer(inv -> {
            ActivityGroup group = inv.getArgument(0);
            group.setId(40L);
            return group;
        });
        when(registrationRepository.findByActivityGroupId(40L))
                .thenReturn(new ArrayList<>())
                .thenReturn(List.of(first));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(inv -> inv.getArgument(0));

        activityGroupService.createGroup(request);

        ArgumentCaptor<Registration> captor = ArgumentCaptor.forClass(Registration.class);
        verify(registrationRepository).save(captor.capture());
        assertThat(captor.getAllValues()).hasSize(1);
        assertThat(captor.getValue().getId()).isEqualTo(20L);
    }

    private void stubLookups() {
        when(seasonRepository.findById(1L)).thenReturn(Optional.of(season));
        when(activityRepository.findByActivityType(ActivityType.SWIMMING))
                .thenReturn(Optional.of(swimming));
        lenient().when(activityGroupRepository.existsBySeasonAndActivityAndName(any(), any(), any()))
                .thenReturn(false);
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
        request.setWaterAdaptationLevel(WaterAdaptationLevel.NOT_INDEPENDENT);
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
