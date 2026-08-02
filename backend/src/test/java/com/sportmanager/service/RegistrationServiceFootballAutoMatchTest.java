package com.sportmanager.service;

import com.sportmanager.dto.request.RegistrationRequest;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityGroup;
import com.sportmanager.entity.ActivityPricing;
import com.sportmanager.entity.GroupTrainingSession;
import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.Gender;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.repository.ActivityGroupRepository;
import com.sportmanager.repository.ActivityPricingRepository;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.ParentRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import com.sportmanager.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceFootballAutoMatchTest {

    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private ParentRepository parentRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private SeasonRepository seasonRepository;
    @Mock
    private ActivityPricingRepository activityPricingRepository;
    @Mock
    private ActivityGroupRepository activityGroupRepository;

    @InjectMocks
    private RegistrationService registrationService;

    private Season season;
    private Activity football;
    private ActivityPricing pricing;

    @BeforeEach
    void setUp() {
        season = new Season();
        season.setId(1L);
        season.setName("2026-2027");
        season.setIsActive(true);

        football = new Activity();
        football.setId(2L);
        football.setActivityType(ActivityType.FOOTBALL);
        football.setIsActive(true);

        pricing = new ActivityPricing();
        pricing.setId(3L);
        pricing.setSeason(season);
        pricing.setActivity(football);
        pricing.setWeeklySessions(2);
        pricing.setMonthlyPrice(new BigDecimal("250"));
        pricing.setAgeGroup(null);
    }

    @Test
    void create_rejectsWhenNoMatchingGroup() {
        stubCommon();
        when(activityGroupRepository.findBySeasonIdAndActivityId(1L, 2L)).thenReturn(List.of());

        assertThatThrownBy(() -> registrationService.createRegistration(baseRequest()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("No active football group");
    }

    @Test
    void create_rejectsWhenMultipleMatchingGroups() {
        stubCommon();
        when(activityGroupRepository.findBySeasonIdAndActivityId(1L, 2L))
                .thenReturn(List.of(group("A", Set.of(AgeGroup.GRADE_1)), group("B", Set.of(AgeGroup.GRADE_1))));

        assertThatThrownBy(() -> registrationService.createRegistration(baseRequest()))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Multiple");
    }

    @Test
    void create_bindsMatchedGroupAndSessionCountPricing() {
        stubCommon();
        ActivityGroup matched = group("כיתות א'-ב'", Set.of(AgeGroup.GRADE_1, AgeGroup.GRADE_2));
        when(activityGroupRepository.findBySeasonIdAndActivityId(1L, 2L)).thenReturn(List.of(matched));
        when(activityPricingRepository
                .findBySeasonAndActivityAndWeeklySessionsAndAgeGroupIsNull(season, football, 2))
                .thenReturn(Optional.of(pricing));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(inv -> {
            Registration registration = inv.getArgument(0);
            registration.setId(99L);
            return registration;
        });

        registrationService.createRegistration(baseRequest());

        ArgumentCaptor<Registration> captor = ArgumentCaptor.forClass(Registration.class);
        verify(registrationRepository).save(captor.capture());
        assertThat(captor.getValue().getActivityGroup()).isSameAs(matched);
        assertThat(captor.getValue().getActivityPricing()).isSameAs(pricing);
    }

    @Test
    void create_pricesByActiveSlotsEvenIfWeeklySessionsFieldIsStale() {
        stubCommon();
        ActivityGroup matched = group("כיתות א'-ב'", Set.of(AgeGroup.GRADE_1, AgeGroup.GRADE_2));
        matched.setWeeklySessions(1); // stale field; two active slots remain
        when(activityGroupRepository.findBySeasonIdAndActivityId(1L, 2L)).thenReturn(List.of(matched));
        when(activityPricingRepository
                .findBySeasonAndActivityAndWeeklySessionsAndAgeGroupIsNull(season, football, 2))
                .thenReturn(Optional.of(pricing));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(inv -> {
            Registration registration = inv.getArgument(0);
            registration.setId(99L);
            return registration;
        });

        registrationService.createRegistration(baseRequest());

        ArgumentCaptor<Registration> captor = ArgumentCaptor.forClass(Registration.class);
        verify(registrationRepository).save(captor.capture());
        assertThat(captor.getValue().getActivityPricing()).isSameAs(pricing);
    }

    private void stubCommon() {
        when(parentRepository.findByPhoneNumber(any())).thenReturn(Optional.empty());
        when(parentRepository.save(any(Parent.class))).thenAnswer(inv -> {
            Parent parent = inv.getArgument(0);
            parent.setId(1L);
            return parent;
        });
        when(studentRepository.findByIdentityNumber(any())).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student student = inv.getArgument(0);
            student.setId(1L);
            return student;
        });
        when(activityRepository.findById(2L)).thenReturn(Optional.of(football));
        when(seasonRepository.findById(1L)).thenReturn(Optional.of(season));
        when(registrationRepository.existsByStudentAndActivityAndSeason(any(), any(), any()))
                .thenReturn(false);
    }

    private ActivityGroup group(String name, Set<AgeGroup> ages) {
        ActivityGroup group = new ActivityGroup();
        group.setId(name.hashCode() & 0xffffL);
        group.setName(name);
        group.setSeason(season);
        group.setActivity(football);
        group.setAgeGroups(ages);
        group.setWeeklySessions(2);
        group.setIsActive(true);
        GroupTrainingSession s1 = new GroupTrainingSession();
        s1.setDayOfWeek(DayOfWeek.SUNDAY);
        s1.setStartTime(LocalTime.of(17, 0));
        s1.setIsActive(true);
        s1.setActivityGroup(group);
        GroupTrainingSession s2 = new GroupTrainingSession();
        s2.setDayOfWeek(DayOfWeek.THURSDAY);
        s2.setStartTime(LocalTime.of(16, 15));
        s2.setIsActive(true);
        s2.setActivityGroup(group);
        group.setTrainingSessions(List.of(s1, s2));
        return group;
    }

    private static RegistrationRequest baseRequest() {
        RegistrationRequest request = new RegistrationRequest();
        request.setParentFirstName("Dana");
        request.setParentLastName("Cohen");
        request.setPhoneNumber("0501234567");
        request.setStudentFirstName("Noa");
        request.setStudentLastName("Cohen");
        request.setStudentIdentityNumber("123456782");
        request.setAge(8);
        request.setAgeGroup(AgeGroup.GRADE_1);
        request.setGender(Gender.FEMALE);
        request.setIsKibbutzMember(false);
        request.setActivityId(2L);
        request.setSeasonId(1L);
        request.setHasMedicalLimitation(false);
        request.setHealthDeclarationApproved(true);
        return request;
    }
}
