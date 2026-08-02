package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Getter
@Builder
public class GroupTrainingSessionResponse {

    private Long id;
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean isActive;
}
