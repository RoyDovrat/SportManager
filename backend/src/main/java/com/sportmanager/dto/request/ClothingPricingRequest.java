package com.sportmanager.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ClothingPricingRequest {

    private Long seasonId;

    private BigDecimal shortKitPrice;

    private BigDecimal longKitPrice;

    private BigDecimal hoodiePrice;

    private Boolean isActive;
}