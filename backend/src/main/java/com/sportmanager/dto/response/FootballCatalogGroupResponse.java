package com.sportmanager.dto.response;

import com.sportmanager.enums.AgeGroup;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Getter
@Builder
public class FootballCatalogGroupResponse {

    private Long id;
    private String name;
    private Set<AgeGroup> ageGroups;
    private Integer weeklySessions;
    private List<GroupTrainingSessionResponse> trainingSessions;
    private BigDecimal monthlyPrice;
    private Long activityPricingId;
}
