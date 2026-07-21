package com.sportmanager.dto.response;

import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.Gender;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class RegistrationResponse {

    private Long id;
    private LocalDate registrationDate;
    private RegistrationStatus status;

    private Long studentId;
    private String studentFirstName;
    private String studentLastName;
    private String studentIdentityNumber;
    private Integer studentAge;
    private AgeGroup studentAgeGroup;
    private Gender studentGender;

    private Long parentId;
    private String parentFirstName;
    private String parentLastName;
    private String phoneNumber;
    private Boolean isKibbutzMember;
    private String budgetNumber;

    private Long activityId;
    private ActivityType activityType;

    private Long seasonId;
    private String seasonName;

    private Long activityPricingId;

    private Long activityGroupId;
    private String activityGroupName;

    private SwimmingLessonType swimmingLessonType;
    private WaterAdaptationLevel waterAdaptationLevel;
    private Boolean healthDeclarationApproved;
    private Boolean hasMedicalLimitation;
    private String medicalNotes;
    private String specialRequests;
}
