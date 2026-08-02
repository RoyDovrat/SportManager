package com.sportmanager.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SwimmingRegistrationSettingsRequest {

    @NotNull(message = "Season id is required")
    private Long seasonId;

    private String introMarkdown;

    private Integer groupWeeklySessions;
}
