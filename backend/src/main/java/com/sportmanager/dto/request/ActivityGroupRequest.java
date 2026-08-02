package com.sportmanager.dto.request;

import com.sportmanager.enums.ActivityType;
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
public class ActivityGroupRequest {

    @NotBlank(message = "Group name is required")
    private String name;

    @NotNull(message = "Season id is required")
    private Long seasonId;

    @NotNull(message = "Activity type is required")
    private ActivityType activityType;

    private Set<AgeGroup> ageGroups;

    private SwimmingLessonType swimmingLessonType;

    private WaterAdaptationLevel waterAdaptationLevel;

    private Integer weeklySessions;

    /** Football training slots (day + start time). Ignored for swimming until needed. */
    private List<GroupTrainingSessionRequest> trainingSessions = new ArrayList<>();

    @NotNull(message = "Is active is required")
    private Boolean isActive;
}
