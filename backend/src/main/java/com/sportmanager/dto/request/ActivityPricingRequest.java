package com.sportmanager.dto.request;

import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.SwimmingLessonType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ActivityPricingRequest {

    @NotNull(message = "Season id is required")
    private Long seasonId;

    @NotNull(message = "Activity type is required")
    private ActivityType activityType;

    private AgeGroup ageGroup;

    private SwimmingLessonType swimmingLessonType;

    /** Required for swimming and football (1 or 2 for football). */
    @Positive(message = "Weekly sessions must be greater than zero")
    private Integer weeklySessions;

    @NotNull(message = "Monthly price is required")
    @DecimalMin(value = "0.01", message = "Monthly price must be greater than zero")
    private BigDecimal monthlyPrice;
}
