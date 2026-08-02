package com.sportmanager.dto.response;

import com.sportmanager.enums.SwimmingLessonType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class SwimmingCatalogPriceResponse {

    private SwimmingLessonType swimmingLessonType;
    /** Unit monthly price for one weekly lesson of this type. */
    private BigDecimal unitMonthlyPrice;
    private Long activityPricingId;
}
