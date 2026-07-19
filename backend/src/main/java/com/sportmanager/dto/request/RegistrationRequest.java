package com.sportmanager.dto.request;

import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.Gender;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistrationRequest {

    @NotBlank(message = "Parent first name is required")
    private String parentFirstName;

    @NotBlank(message = "Parent last name is required")
    private String parentLastName;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Student first name is required")
    private String studentFirstName;

    @NotBlank(message = "Student last name is required")
    private String studentLastName;

    @NotBlank(message = "Student identity number is required")
    private String studentIdentityNumber;

    @NotNull(message = "Age is required")
    @Positive(message = "Age must be greater than zero")
    private Integer age;

    @NotNull(message = "Age group is required")
    private AgeGroup ageGroup;

    @NotNull(message = "Gender is required")
    private Gender gender;

    @NotNull(message = "Kibbutz membership status is required")
    private Boolean isKibbutzMember;

    private String budgetNumber;

    @NotNull(message = "Activity id is required")
    private Long activityId;

    @NotNull(message = "Season id is required")
    private Long seasonId;

    private SwimmingLessonType swimmingLessonType;
    private WaterAdaptationLevel waterAdaptationLevel;
    private Integer weeklySessions;

    @NotNull(message = "Medical limitation status is required")
    private Boolean hasMedicalLimitation;

    @NotNull(message = "Health declaration approval is required")
    private Boolean healthDeclarationApproved;

    private String medicalNotes;
    private String specialRequests;
}
