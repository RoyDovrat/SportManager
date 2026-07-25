package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ParentResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Boolean isKibbutzMember;
    private String budgetNumber;
    private int studentCount;
}
