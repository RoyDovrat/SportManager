package com.sportmanager.dto.request;

import com.sportmanager.enums.ActivityType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ActivityRequest {

    @NotNull(message = "Activity type is required")
    private ActivityType activityType;

    @NotNull(message = "Is active is required")
    private Boolean isActive;
}