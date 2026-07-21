package com.sportmanager.dto.response;

import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.SwimmingLessonType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ActivityPricingResponse {

    private Long id;
    private Long seasonId;
    private String seasonName;
    private Long activityId;
    private ActivityType activityType;
    private AgeGroup ageGroup;
    private SwimmingLessonType swimmingLessonType;
    private Integer weeklySessions;
    private BigDecimal monthlyPrice;
}
