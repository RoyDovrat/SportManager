package com.sportmanager.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SwimmingRegistrationSettingsUpdateRequest {

    private String introMarkdown;

    private Integer groupWeeklySessions;
}
