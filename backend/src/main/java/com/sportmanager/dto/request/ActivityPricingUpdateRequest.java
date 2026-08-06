package com.sportmanager.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ActivityPricingUpdateRequest {

    @Positive(message = "Weekly sessions must be greater than zero")
    private Integer weeklySessions;

    @NotNull(message = "Weekly price is required")
    @DecimalMin(value = "0.01", message = "Weekly price must be greater than zero")
    private BigDecimal monthlyPrice;
}
