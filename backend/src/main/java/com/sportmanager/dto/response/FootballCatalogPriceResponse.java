package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class FootballCatalogPriceResponse {

    private Integer weeklySessions;
    private BigDecimal monthlyPrice;
    private Long activityPricingId;
}
