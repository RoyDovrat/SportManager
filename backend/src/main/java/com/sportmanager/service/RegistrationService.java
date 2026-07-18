package com.sportmanager.service;

import com.sportmanager.dto.request.RegistrationRequest;
import com.sportmanager.entity.*;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

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
    public Registration createRegistration(RegistrationRequest request) {

        Parent parent = getOrCreateParent(request);

        Student student = getOrCreateStudent(parent, request);

        Activity activity = getActivity(request.getActivityId());

        Season season = getSeason(request.getSeasonId());

        validateRegistrationDoesNotExist(student, activity, season);

        ActivityPricing activityPricing = getActivityPricing(request, activity, season);

        Registration registration = buildRegistration(request, student, activity, season, activityPricing);

        return registrationRepository.save(registration);
    }

    private Parent getOrCreateParent(RegistrationRequest request) {
        Parent parent = parentRepository.findByPhoneNumber(
                        request.getPhoneNumber()
                )
                .orElseGet(Parent::new);

        parent.setFirstName(
                request.getParentFirstName()
        );
        parent.setLastName(
                request.getParentLastName()
        );
        parent.setPhoneNumber(
                request.getPhoneNumber()
        );
        parent.setIsKibbutzMember(
                request.getIsKibbutzMember()
        );
        parent.setBudgetNumber(
                request.getBudgetNumber()
        );

        return parentRepository.save(parent);
    }

    private Student getOrCreateStudent(
            Parent parent,
            RegistrationRequest request
    ) {
        Student student = studentRepository
                .findByIdentityNumber(
                        request.getStudentIdentityNumber()
                )
                .orElseGet(Student::new);

        if (student.getId() != null
                && !student.getParent()
                .getId()
                .equals(parent.getId())) {

            throw new RuntimeException(
                    "Student identity number is associated with another parent"
            );
        }

        student.setIdentityNumber(
                request.getStudentIdentityNumber()
        );
        student.setFirstName(
                request.getStudentFirstName()
        );
        student.setLastName(
                request.getStudentLastName()
        );
        student.setAge(request.getAge());
        student.setAgeGroup(request.getAgeGroup());
        student.setGender(request.getGender());
        student.setParent(parent);

        return studentRepository.save(student);
    }

    private Activity getActivity(Long activityId) {
        return activityRepository
                .findById(activityId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Activity not found"
                        )
                );
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository
                .findById(seasonId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Season not found"
                        )
                );
    }

    private ActivityPricing getActivityPricing(
            RegistrationRequest request,
            Activity activity,
            Season season
    ) {
        if (activity.getActivityType()
                == ActivityType.FOOTBALL) {

            return activityPricingRepository
                    .findBySeasonAndActivityAndAgeGroup(
                            season,
                            activity,
                            request.getAgeGroup()
                    )
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Active football pricing was not found for this age group"
                            )
                    );
        }

        if (activity.getActivityType()
                == ActivityType.SWIMMING) {

            return activityPricingRepository
                    .findBySeasonAndActivityAndSwimmingLessonTypeAndWeeklySessions(
                            season,
                            activity,
                            request.getSwimmingLessonType(),
                            request.getWeeklySessions()
                    )
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Active swimming pricing was not found"
                            )
                    );
        }

        throw new RuntimeException(
                "Unsupported activity type"
        );
    }

    private void validateRegistrationDoesNotExist(
            Student student,
            Activity activity,
            Season season
    ) {
        boolean exists =
                registrationRepository
                        .existsByStudentAndActivityAndSeason(
                                student,
                                activity,
                                season
                        );

        if (exists) {
            throw new RuntimeException(
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
        Registration registration =
                new Registration();

        registration.setStudent(student);
        registration.setActivity(activity);
        registration.setSeason(season);
        registration.setActivityPricing(
                activityPricing
        );

        registration.setRegistrationDate(
                LocalDate.now()
        );

        registration.setSwimmingLessonType(
                request.getSwimmingLessonType()
        );

        registration.setWaterAdaptationLevel(
                request.getWaterAdaptationLevel()
        );

        registration.setHasMedicalLimitation(
                request.getHasMedicalLimitation()
        );

        registration.setHealthDeclarationApproved(
                request.getHealthDeclarationApproved()
        );

        registration.setMedicalNotes(
                request.getMedicalNotes()
        );

        registration.setSpecialRequests(
                request.getSpecialRequests()
        );

        registration.setStatus(
                RegistrationStatus.APPROVED
        );

        return registration;
    }
}