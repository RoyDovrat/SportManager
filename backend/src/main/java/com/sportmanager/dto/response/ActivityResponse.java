package com.sportmanager.dto.response;

import com.sportmanager.enums.ActivityType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ActivityResponse {

    private Long id;
    private ActivityType activityType;
    private Boolean isActive;
}
