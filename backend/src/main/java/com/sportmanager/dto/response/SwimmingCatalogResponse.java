package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SwimmingCatalogResponse {

    private Long seasonId;
    private String seasonName;
    private Long activityId;
    private String introMarkdown;
    /** Fixed weekly sessions for GROUP lessons (admin-configurable, default 2). */
    private Integer groupWeeklySessions;
    private List<SwimmingCatalogPriceResponse> prices;
}
