package com.sportmanager.dto.request;

import com.sportmanager.enums.ActivityType;
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

    private SwimmingLessonType swimmingLessonType;

    /** Required for football (1 or 2). Ignored for swimming (always stored as 1). */
    @Positive(message = "Weekly sessions must be greater than zero")
    private Integer weeklySessions;

    @NotNull(message = "Weekly price is required")
    @DecimalMin(value = "0.01", message = "Weekly price must be greater than zero")
    private BigDecimal monthlyPrice;
}
