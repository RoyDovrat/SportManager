package com.sportmanager.service;

import com.sportmanager.dto.request.RegistrationRequest;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ActivityGroup;
import com.sportmanager.entity.ActivityPricing;
import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ActivityPricingRepository;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.ParentRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import com.sportmanager.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final ParentRepository parentRepository;
    private final StudentRepository studentRepository;
    private final ActivityRepository activityRepository;
    private final SeasonRepository seasonRepository;
    private final ActivityPricingRepository activityPricingRepository;

    @Transactional
    public RegistrationResponse createRegistration(RegistrationRequest request) {
        validateRegistrationRequest(request);

        Parent parent = getOrCreateParent(request);
        Student student = getOrCreateStudent(parent, request);
        Activity activity = getActiveActivity(request.getActivityId());
        Season season = getActiveSeason(request.getSeasonId());

        validateActivitySpecificFields(request, activity);
        validateRegistrationDoesNotExist(student, activity, season);

        ActivityPricing activityPricing = getActivityPricing(request, activity, season);
        Registration registration = buildRegistration(
                request,
                student,
                activity,
                season,
                activityPricing
        );

        Registration saved = registrationRepository.save(registration);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public RegistrationResponse getRegistrationById(Long registrationId) {
        return toResponse(getRegistrationEntity(registrationId));
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getRegistrations(Long seasonId, RegistrationStatus status) {
        List<Registration> registrations;

        if (seasonId != null && status != null) {
            registrations = registrationRepository.findBySeasonIdAndStatus(seasonId, status);
        } else if (seasonId != null) {
            registrations = registrationRepository.findBySeasonId(seasonId);
        } else if (status != null) {
            registrations = registrationRepository.findByStatus(status);
        } else {
            registrations = registrationRepository.findAll();
        }

        return registrations.stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Registration getRegistrationEntity(Long registrationId) {
        return registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Registration was not found with id: " + registrationId
                ));
    }

    @Transactional
    public RegistrationResponse approveRegistration(Long registrationId) {
        Registration registration = getRegistrationEntity(registrationId);

        if (registration.getStatus() == RegistrationStatus.APPROVED) {
            throw new ConflictException("Registration is already approved");
        }
        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new BusinessRuleException("Cancelled registrations cannot be approved");
        }

        registration.setStatus(RegistrationStatus.APPROVED);
        return toResponse(registrationRepository.save(registration));
    }

    @Transactional
    public RegistrationResponse cancelRegistration(Long registrationId) {
        Registration registration = getRegistrationEntity(registrationId);

        if (registration.getStatus() == RegistrationStatus.CANCELLED) {
            throw new ConflictException("Registration is already cancelled");
        }

        registration.setStatus(RegistrationStatus.CANCELLED);
        registration.setActivityGroup(null);
        return toResponse(registrationRepository.save(registration));
    }

    private void validateRegistrationRequest(RegistrationRequest request) {
        if (!Boolean.TRUE.equals(request.getHealthDeclarationApproved())) {
            throw new BusinessRuleException(
                    "Health declaration must be approved to complete registration"
            );
        }

        if (Boolean.TRUE.equals(request.getIsKibbutzMember())
                && isBlank(request.getBudgetNumber())) {
            throw new BusinessRuleException(
                    "Budget number is required for a kibbutz member"
            );
        }
    }

    private void validateActivitySpecificFields(
            RegistrationRequest request,
            Activity activity
    ) {
        if (activity.getActivityType() == ActivityType.FOOTBALL) {
            if (request.getSwimmingLessonType() != null
                    || request.getWaterAdaptationLevel() != null
                    || request.getWeeklySessions() != null) {
                throw new BusinessRuleException(
                        "Swimming fields must not be provided for football registration"
                );
            }
            return;
        }

        if (activity.getActivityType() == ActivityType.SWIMMING) {
            if (request.getSwimmingLessonType() == null) {
                throw new BusinessRuleException(
                        "Swimming lesson type is required for swimming registration"
                );
            }
            if (request.getWaterAdaptationLevel() == null) {
                throw new BusinessRuleException(
                        "Water adaptation level is required for swimming registration"
                );
            }
            if (request.getWeeklySessions() == null || request.getWeeklySessions() <= 0) {
                throw new BusinessRuleException(
                        "Weekly sessions must be greater than zero for swimming registration"
                );
            }
            return;
        }

        throw new BusinessRuleException("Unsupported activity type");
    }

    private Parent getOrCreateParent(RegistrationRequest request) {
        Parent parent = parentRepository.findByPhoneNumber(request.getPhoneNumber())
                .orElseGet(Parent::new);

        parent.setFirstName(request.getParentFirstName());
        parent.setLastName(request.getParentLastName());
        parent.setPhoneNumber(request.getPhoneNumber());
        parent.setIsKibbutzMember(request.getIsKibbutzMember());

        if (Boolean.TRUE.equals(request.getIsKibbutzMember())) {
            parent.setBudgetNumber(request.getBudgetNumber());
        } else {
            parent.setBudgetNumber(null);
        }

        return parentRepository.save(parent);
    }

    private Student getOrCreateStudent(Parent parent, RegistrationRequest request) {
        Student student = studentRepository
                .findByIdentityNumber(request.getStudentIdentityNumber())
                .orElseGet(Student::new);

        if (student.getId() != null
                && !student.getParent().getId().equals(parent.getId())) {
            throw new BusinessRuleException(
                    "Student identity number is associated with another parent"
            );
        }

        student.setIdentityNumber(request.getStudentIdentityNumber());
        student.setFirstName(request.getStudentFirstName());
        student.setLastName(request.getStudentLastName());
        student.setAge(request.getAge());
        student.setAgeGroup(request.getAgeGroup());
        student.setGender(request.getGender());
        student.setParent(parent);

        return studentRepository.save(student);
    }

    private Activity getActiveActivity(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Activity was not found with id: " + activityId
                ));

        if (!Boolean.TRUE.equals(activity.getIsActive())) {
            throw new BusinessRuleException(
                    "Registrations can only be created for an active activity"
            );
        }

        return activity;
    }

    private Season getActiveSeason(Long seasonId) {
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));

        if (!Boolean.TRUE.equals(season.getIsActive())) {
            throw new BusinessRuleException(
                    "Registrations can only be created for an active season"
            );
        }

        return season;
    }

    private ActivityPricing getActivityPricing(
            RegistrationRequest request,
            Activity activity,
            Season season
    ) {
        if (activity.getActivityType() == ActivityType.FOOTBALL) {
            return activityPricingRepository
                    .findBySeasonAndActivityAndAgeGroup(
                            season,
                            activity,
                            request.getAgeGroup()
                    )
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Football pricing was not found for this age group in the selected season"
                    ));
        }

        return activityPricingRepository
                .findBySeasonAndActivityAndSwimmingLessonTypeAndWeeklySessions(
                        season,
                        activity,
                        request.getSwimmingLessonType(),
                        request.getWeeklySessions()
                )
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Swimming pricing was not found for this lesson type and weekly sessions"
                ));
    }

    private void validateRegistrationDoesNotExist(
            Student student,
            Activity activity,
            Season season
    ) {
        if (registrationRepository.existsByStudentAndActivityAndSeason(
                student,
                activity,
                season
        )) {
            throw new ConflictException(
                    "Student is already registered to this activity in this season"
            );
        }
    }

    private Registration buildRegistration(
            RegistrationRequest request,
            Student student,
            Activity activity,
            Season season,
            ActivityPricing activityPricing
    ) {
        Registration registration = new Registration();

        registration.setStudent(student);
        registration.setActivity(activity);
        registration.setSeason(season);
        registration.setActivityPricing(activityPricing);
        registration.setRegistrationDate(LocalDate.now());
        registration.setHasMedicalLimitation(request.getHasMedicalLimitation());
        registration.setHealthDeclarationApproved(request.getHealthDeclarationApproved());
        registration.setMedicalNotes(request.getMedicalNotes());
        registration.setSpecialRequests(request.getSpecialRequests());
        registration.setStatus(RegistrationStatus.PENDING);

        if (activity.getActivityType() == ActivityType.SWIMMING) {
            registration.setSwimmingLessonType(request.getSwimmingLessonType());
            registration.setWaterAdaptationLevel(request.getWaterAdaptationLevel());
        } else {
            registration.setSwimmingLessonType(null);
            registration.setWaterAdaptationLevel(null);
        }

        return registration;
    }

    public RegistrationResponse toResponse(Registration registration) {
        Student student = registration.getStudent();
        Parent parent = student.getParent();
        Activity activity = registration.getActivity();
        Season season = registration.getSeason();
        ActivityGroup activityGroup = registration.getActivityGroup();

        return RegistrationResponse.builder()
                .id(registration.getId())
                .registrationDate(registration.getRegistrationDate())
                .status(registration.getStatus())
                .studentId(student.getId())
                .studentFirstName(student.getFirstName())
                .studentLastName(student.getLastName())
                .studentIdentityNumber(student.getIdentityNumber())
                .studentAge(student.getAge())
                .studentAgeGroup(student.getAgeGroup())
                .studentGender(student.getGender())
                .parentId(parent.getId())
                .parentFirstName(parent.getFirstName())
                .parentLastName(parent.getLastName())
                .phoneNumber(parent.getPhoneNumber())
                .isKibbutzMember(parent.getIsKibbutzMember())
                .budgetNumber(parent.getBudgetNumber())
                .activityId(activity.getId())
                .activityType(activity.getActivityType())
                .seasonId(season.getId())
                .seasonName(season.getName())
                .activityPricingId(registration.getActivityPricing().getId())
                .activityGroupId(activityGroup != null ? activityGroup.getId() : null)
                .activityGroupName(activityGroup != null ? activityGroup.getName() : null)
                .swimmingLessonType(registration.getSwimmingLessonType())
                .waterAdaptationLevel(registration.getWaterAdaptationLevel())
                .healthDeclarationApproved(registration.getHealthDeclarationApproved())
                .hasMedicalLimitation(registration.getHasMedicalLimitation())
                .medicalNotes(registration.getMedicalNotes())
                .specialRequests(registration.getSpecialRequests())
                .build();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
