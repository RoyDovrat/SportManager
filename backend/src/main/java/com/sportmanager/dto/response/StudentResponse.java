package com.sportmanager.dto.response;

import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.Gender;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StudentResponse {

    private Long id;
    private String identityNumber;
    private String firstName;
    private String lastName;
    private Gender gender;
    private Integer age;
    private AgeGroup ageGroup;
    private Long parentId;
    private String parentFirstName;
    private String parentLastName;
    private String parentPhoneNumber;
    private Boolean isKibbutzMember;
}
