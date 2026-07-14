package com.sportmanager.dto.request;

import com.sportmanager.enums.Gender;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import com.sportmanager.enums.AgeGroup;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistrationRequest {

    // Parent
    private String parentFirstName;
    private String parentLastName;
    private String phoneNumber;

    // Student
    private String studentFirstName;
    private String studentLastName;
    private String studentIdentityNumber;
    private Integer age;
    private AgeGroup ageGroup;
    private Gender gender;

    // Payment
    private Boolean isKibbutzMember;
    private String budgetNumber;

    // Registration
    private Long activityId;
    private Long seasonId;

    private SwimmingLessonType swimmingLessonType;
    private WaterAdaptationLevel waterAdaptationLevel;

    private Boolean hasMedicalLimitation;
    private Boolean healthDeclarationApproved;

    private String medicalNotes;
    private String specialRequests;
}