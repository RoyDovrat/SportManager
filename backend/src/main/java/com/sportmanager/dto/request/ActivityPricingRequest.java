package com.sportmanager.dto.request;

import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.SwimmingLessonType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ActivityPricingRequest {

    private Long seasonId;

    private ActivityType activityType;

    private AgeGroup ageGroup;

    private SwimmingLessonType swimmingLessonType;

    private Integer weeklySessions;

    private BigDecimal monthlyPrice;
}