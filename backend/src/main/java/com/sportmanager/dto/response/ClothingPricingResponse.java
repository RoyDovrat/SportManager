package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ClothingPricingResponse {

    private Long id;
    private Long seasonId;
    private String seasonName;
    private BigDecimal shortKitPrice;
    private BigDecimal longKitPrice;
    private BigDecimal hoodiePrice;
}
