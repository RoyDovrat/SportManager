package com.sportmanager.dto.response;

import com.sportmanager.enums.ActivityType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class SeasonNearingEndResponse {

    private Long id;
    private String name;
    private ActivityType activityType;
    private LocalDate endDate;
}
