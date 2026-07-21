package com.sportmanager.dto.response;

import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ActivityGroupResponse {

    private Long id;
    private String name;
    private Long seasonId;
    private String seasonName;
    private Long activityId;
    private ActivityType activityType;
    private AgeGroup ageGroup;
    private SwimmingLessonType swimmingLessonType;
    private WaterAdaptationLevel waterAdaptationLevel;
    private Boolean isActive;
    private int memberCount;
}
