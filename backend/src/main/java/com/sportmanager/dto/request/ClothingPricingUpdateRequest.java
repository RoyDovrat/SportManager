package com.sportmanager.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ClothingPricingUpdateRequest {

    @NotNull(message = "Short kit price is required")
    @DecimalMin(value = "0.01", message = "Short kit price must be greater than zero")
    private BigDecimal shortKitPrice;

    /** Required only when longKitPublicEnabled is true; otherwise ignored (stored as 0). */
    private BigDecimal longKitPrice;

    /** Required only when hoodiePublicEnabled is true; otherwise ignored (stored as 0). */
    private BigDecimal hoodiePrice;

    @NotNull(message = "allowAlreadyHasClothingSkip is required")
    private Boolean allowAlreadyHasClothingSkip = true;

    @NotNull(message = "longKitPublicEnabled is required")
    private Boolean longKitPublicEnabled = true;

    @NotNull(message = "hoodiePublicEnabled is required")
    private Boolean hoodiePublicEnabled = true;

    public BigDecimal getShortKitPrice() {
        return shortKitPrice;
    }

    public void setShortKitPrice(BigDecimal shortKitPrice) {
        this.shortKitPrice = shortKitPrice;
    }

    public BigDecimal getLongKitPrice() {
        return longKitPrice;
    }

    public void setLongKitPrice(BigDecimal longKitPrice) {
        this.longKitPrice = longKitPrice;
    }

    public BigDecimal getHoodiePrice() {
        return hoodiePrice;
    }

    public void setHoodiePrice(BigDecimal hoodiePrice) {
        this.hoodiePrice = hoodiePrice;
    }

    public Boolean getAllowAlreadyHasClothingSkip() {
        return allowAlreadyHasClothingSkip;
    }

    public void setAllowAlreadyHasClothingSkip(Boolean allowAlreadyHasClothingSkip) {
        this.allowAlreadyHasClothingSkip = allowAlreadyHasClothingSkip;
    }

    public Boolean getLongKitPublicEnabled() {
        return longKitPublicEnabled;
    }

    public void setLongKitPublicEnabled(Boolean longKitPublicEnabled) {
        this.longKitPublicEnabled = longKitPublicEnabled;
    }

    public Boolean getHoodiePublicEnabled() {
        return hoodiePublicEnabled;
    }

    public void setHoodiePublicEnabled(Boolean hoodiePublicEnabled) {
        this.hoodiePublicEnabled = hoodiePublicEnabled;
    }
}
