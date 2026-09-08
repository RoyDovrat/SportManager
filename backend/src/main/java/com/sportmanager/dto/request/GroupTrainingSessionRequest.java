package com.sportmanager.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Getter
@Setter
public class GroupTrainingSessionRequest {

    private Long id;

    @NotNull(message = "יש לבחור יום")
    private DayOfWeek dayOfWeek;

    @NotNull(message = "יש לבחור שעת התחלה")
    private LocalTime startTime;

    private LocalTime endTime;

    @NotNull(message = "יש לציין אם המפגש פעיל")
    private Boolean isActive = true;
}
