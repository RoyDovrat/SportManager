package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ClothingCatalogResponse {

    private Long seasonId;
    private String seasonName;
    private boolean pricingConfigured;
    private BigDecimal shortKitPrice;
    private BigDecimal longKitPrice;
    private BigDecimal hoodiePrice;
    private boolean allowAlreadyHasClothingSkip;
}
