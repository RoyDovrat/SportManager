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

    @NotBlank(message = "יש להזין שם קבוצה")
    private String name;

    @NotNull(message = "יש לבחור עונה")
    private Long seasonId;

    @NotNull(message = "יש לבחור סוג חוג")
    private ActivityType activityType;

    private Set<AgeGroup> ageGroups;

    private SwimmingLessonType swimmingLessonType;

    private Set<WaterAdaptationLevel> waterAdaptationLevels;

    /** Accepted so older clients that still send a single value keep working. */
    private WaterAdaptationLevel waterAdaptationLevel;

    private Integer weeklySessions;

    /** Football training slots (day + start time). Ignored for swimming until needed. */
    private List<GroupTrainingSessionRequest> trainingSessions = new ArrayList<>();

    @NotNull(message = "יש לציין אם הקבוצה פעילה")
    private Boolean isActive;
}
