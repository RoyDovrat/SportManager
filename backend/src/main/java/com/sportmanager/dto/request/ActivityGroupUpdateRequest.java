package com.sportmanager.dto.request;

import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Getter
@Setter
public class ActivityGroupUpdateRequest {

    @NotBlank(message = "Group name is required")
    private String name;

    private Set<AgeGroup> ageGroups;

    private SwimmingLessonType swimmingLessonType;

    private WaterAdaptationLevel waterAdaptationLevel;

    private Integer weeklySessions;

    private List<GroupTrainingSessionRequest> trainingSessions = new ArrayList<>();

    @NotNull(message = "Is active is required")
    private Boolean isActive;
}
