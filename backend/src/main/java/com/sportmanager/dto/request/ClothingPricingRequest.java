package com.sportmanager.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ClothingPricingRequest {

    @NotNull(message = "Season id is required")
    private Long seasonId;

    @NotNull(message = "Short kit price is required")
    @DecimalMin(value = "0.01", message = "Short kit price must be greater than zero")
    private BigDecimal shortKitPrice;

    @NotNull(message = "Long kit price is required")
    @DecimalMin(value = "0.01", message = "Long kit price must be greater than zero")
    private BigDecimal longKitPrice;

    @NotNull(message = "Hoodie price is required")
    @DecimalMin(value = "0.01", message = "Hoodie price must be greater than zero")
    private BigDecimal hoodiePrice;
}
