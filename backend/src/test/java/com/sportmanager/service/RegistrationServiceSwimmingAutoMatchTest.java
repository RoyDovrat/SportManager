package com.sportmanager.service;

import com.sportmanager.dto.request.RegistrationRequest;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityPricing;
import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.Gender;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
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
import org.springframework.beans.factory.ObjectProvider;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceSwimmingAutoMatchTest {

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
    @Mock
    private SwimmingRegistrationSettingsService swimmingRegistrationSettingsService;
    @Mock
    private ObjectProvider<PaymentService> paymentServiceProvider;
    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private RegistrationService registrationService;

    private Season season;
    private Activity swimming;
    private ActivityPricing pricing;

    @BeforeEach
    void setUp() {
        season = new Season();
        season.setId(1L);
        season.setName("2026-2027");
        season.setIsActive(true);
        season.setActivityType(ActivityType.SWIMMING);

        swimming = new Activity();
        swimming.setId(3L);
        swimming.setActivityType(ActivityType.SWIMMING);
        swimming.setIsActive(true);

        pricing = new ActivityPricing();
        pricing.setId(4L);
        pricing.setSeason(season);
        pricing.setActivity(swimming);
        pricing.setSwimmingLessonType(SwimmingLessonType.PRIVATE);
        pricing.setWeeklySessions(1);
        pricing.setMonthlyPrice(new BigDecimal("120"));

        lenient().when(paymentServiceProvider.getObject()).thenReturn(paymentService);
    }

    @Test
    void create_doesNotAssignSwimmingGroup() {
        stubCreateCommon();

        registrationService.createRegistration(baseRequest());

        ArgumentCaptor<Registration> captor = ArgumentCaptor.forClass(Registration.class);
        verify(registrationRepository).save(captor.capture());
        assertThat(captor.getValue().getActivityGroup()).isNull();
    }

    @Test
    void approve_doesNotAssignSwimmingGroup() {
        Registration registration = pendingSwimmingRegistration();
        registration.setActivityPricing(pricing);
        when(registrationRepository.findById(50L)).thenReturn(Optional.of(registration));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(inv -> inv.getArgument(0));

        registrationService.approveRegistration(50L);

        assertThat(registration.getActivityGroup()).isNull();
        verify(paymentService).ensureSeasonMonthlyPayments(registration);
    }

    private void stubCreateCommon() {
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
        when(activityRepository.findById(3L)).thenReturn(Optional.of(swimming));
        when(seasonRepository.findById(1L)).thenReturn(Optional.of(season));
        when(registrationRepository.existsByStudentAndActivityAndSeason(any(), any(), any()))
                .thenReturn(false);
        when(activityPricingRepository
                .findBySeasonAndActivityAndSwimmingLessonTypeAndWeeklySessions(
                        season, swimming, SwimmingLessonType.PRIVATE, 1))
                .thenReturn(Optional.of(pricing));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(inv -> {
            Registration registration = inv.getArgument(0);
            registration.setId(99L);
            return registration;
        });
    }

    private Registration pendingSwimmingRegistration() {
        Parent parent = new Parent();
        parent.setId(1L);
        Student student = new Student();
        student.setId(1L);
        student.setAgeGroup(AgeGroup.GRADE_1);
        student.setParent(parent);

        Registration registration = new Registration();
        registration.setId(50L);
        registration.setStudent(student);
        registration.setActivity(swimming);
        registration.setSeason(season);
        registration.setStatus(RegistrationStatus.PENDING);
        registration.setSwimmingLessonType(SwimmingLessonType.PRIVATE);
        registration.setWaterAdaptationLevel(WaterAdaptationLevel.NOT_INDEPENDENT);
        registration.setWeeklySessions(2);
        return registration;
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
        request.setActivityId(3L);
        request.setSeasonId(1L);
        request.setHasMedicalLimitation(false);
        request.setHealthDeclarationApproved(true);
        request.setSwimmingLessonType(SwimmingLessonType.PRIVATE);
        request.setWaterAdaptationLevel(WaterAdaptationLevel.NOT_INDEPENDENT);
        request.setWeeklySessions(2);
        return request;
    }
}
