package com.sportmanager.dto.request;

import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.Gender;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegistrationAdminUpdateRequest {

    @NotBlank
    private String parentFirstName;

    @NotBlank
    private String parentLastName;

    @NotBlank
    private String phoneNumber;

    @NotNull
    private Boolean isKibbutzMember;

    private String budgetNumber;

    @NotBlank
    private String studentFirstName;

    @NotBlank
    private String studentLastName;

    @NotNull
    @Min(1)
    @Max(120)
    private Integer age;

    @NotNull
    private AgeGroup ageGroup;

    @NotNull
    private Gender gender;

    @NotNull
    private Boolean hasMedicalLimitation;

    private String medicalNotes;

    private String specialRequests;

    private SwimmingLessonType swimmingLessonType;

    private WaterAdaptationLevel waterAdaptationLevel;

    @Min(1)
    @Max(6)
    private Integer weeklySessions;
}
