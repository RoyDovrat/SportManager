package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class FootballCatalogResponse {

    private Long seasonId;
    private String seasonName;
    private Long activityId;
    private List<FootballCatalogGroupResponse> groups;
    private List<FootballCatalogPriceResponse> prices;
}
