package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ClothingEligibilityResponse {

    private boolean eligible;
    private Long seasonId;
    private Long registrationId;
    private Long studentId;
    private String studentIdentityNumber;
    private String studentFirstName;
    private String studentLastName;
}
