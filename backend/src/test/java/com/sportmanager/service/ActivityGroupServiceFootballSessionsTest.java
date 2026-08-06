package com.sportmanager.service;

import com.sportmanager.dto.request.ActivityGroupRequest;
import com.sportmanager.dto.request.GroupTrainingSessionRequest;
import com.sportmanager.dto.response.ActivityGroupResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityGroup;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.exception.BusinessRuleException;
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
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Football groups persist and validate training sessions. */
@ExtendWith(MockitoExtension.class)
class ActivityGroupServiceFootballSessionsTest {

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
    private Activity football;

    @BeforeEach
    void setUp() {
        season = new Season();
        season.setId(1L);
        season.setName("2026-2027");

        football = new Activity();
        football.setId(10L);
        football.setActivityType(ActivityType.FOOTBALL);
        football.setIsActive(true);

        lenient().when(paymentServiceProvider.getObject()).thenReturn(paymentService);
    }

    @Test
    void createFootballGroup_rejectsActiveGroupWithoutTrainingSessions() {
        stubLookups();
        ActivityGroupRequest request = baseFootballRequest(true, 2);
        request.setTrainingSessions(List.of());

        assertThatThrownBy(() -> activityGroupService.createGroup(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("training");
    }

    @Test
    void createFootballGroup_rejectsDuplicateDayAndStartTime() {
        stubLookups();
        ActivityGroupRequest request = baseFootballRequest(true, 2);
        request.setTrainingSessions(List.of(
                session(DayOfWeek.SUNDAY, LocalTime.of(17, 0), true),
                session(DayOfWeek.SUNDAY, LocalTime.of(17, 0), true)
        ));

        assertThatThrownBy(() -> activityGroupService.createGroup(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("duplicate");
    }

    @Test
    void createFootballGroup_rejectsMoreThanTwoActiveSlots() {
        stubLookups();
        ActivityGroupRequest request = baseFootballRequest(true, 2);
        request.setTrainingSessions(List.of(
                session(DayOfWeek.SUNDAY, LocalTime.of(17, 0), true),
                session(DayOfWeek.THURSDAY, LocalTime.of(16, 15), true),
                session(DayOfWeek.TUESDAY, LocalTime.of(16, 0), true)
        ));

        assertThatThrownBy(() -> activityGroupService.createGroup(request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("at most 2");
    }

    @Test
    void createFootballGroup_derivesWeeklySessionsFromActiveSlots() {
        stubLookups();
        when(activityGroupRepository.save(any(ActivityGroup.class))).thenAnswer(invocation -> {
            ActivityGroup group = invocation.getArgument(0);
            group.setId(99L);
            return group;
        });
        when(registrationRepository.findByActivityGroupId(99L)).thenReturn(List.of());

        // Stale weeklySessions=1 must not win over two configured training slots.
        ActivityGroupRequest request = baseFootballRequest(true, 1);
        request.setTrainingSessions(List.of(
                session(DayOfWeek.SUNDAY, LocalTime.of(17, 0), true),
                session(DayOfWeek.THURSDAY, LocalTime.of(16, 15), true)
        ));

        ActivityGroupResponse response = activityGroupService.createGroup(request);

        ArgumentCaptor<ActivityGroup> captor = ArgumentCaptor.forClass(ActivityGroup.class);
        verify(activityGroupRepository).save(captor.capture());
        ActivityGroup saved = captor.getValue();

        assertThat(saved.getWeeklySessions()).isEqualTo(2);
        assertThat(saved.getTrainingSessions()).hasSize(2);
        assertThat(response.getWeeklySessions()).isEqualTo(2);
        assertThat(response.getTrainingSessions())
                .extracting(s -> s.getDayOfWeek() + " " + s.getStartTime())
                .containsExactlyInAnyOrder(
                        "SUNDAY 17:00",
                        "THURSDAY 16:15"
                );
    }

    private void stubLookups() {
        when(seasonRepository.findById(1L)).thenReturn(Optional.of(season));
        when(activityRepository.findByActivityType(ActivityType.FOOTBALL))
                .thenReturn(Optional.of(football));
        lenient().when(activityGroupRepository.existsBySeasonAndActivityAndName(any(), any(), any()))
                .thenReturn(false);
        lenient().when(activityGroupRepository.findBySeasonIdAndActivityId(1L, 10L))
                .thenReturn(List.of());
    }

    private static ActivityGroupRequest baseFootballRequest(boolean active, int weeklySessions) {
        ActivityGroupRequest request = new ActivityGroupRequest();
        request.setName("כיתות א'-ב'");
        request.setSeasonId(1L);
        request.setActivityType(ActivityType.FOOTBALL);
        request.setAgeGroups(Set.of(AgeGroup.GRADE_1, AgeGroup.GRADE_2));
        request.setWeeklySessions(weeklySessions);
        request.setIsActive(active);
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
