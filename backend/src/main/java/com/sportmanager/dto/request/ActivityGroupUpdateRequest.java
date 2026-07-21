package com.sportmanager.dto.request;

import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActivityGroupUpdateRequest {

    @NotBlank(message = "Group name is required")
    private String name;

    private AgeGroup ageGroup;

    private SwimmingLessonType swimmingLessonType;

    private WaterAdaptationLevel waterAdaptationLevel;

    @NotNull(message = "Is active is required")
    private Boolean isActive;
}
