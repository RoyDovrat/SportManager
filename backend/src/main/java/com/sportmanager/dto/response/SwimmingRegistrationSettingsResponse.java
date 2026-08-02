package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SwimmingRegistrationSettingsResponse {

    private Long id;
    private Long seasonId;
    private String seasonName;
    private String introMarkdown;
    private Integer groupWeeklySessions;
}
