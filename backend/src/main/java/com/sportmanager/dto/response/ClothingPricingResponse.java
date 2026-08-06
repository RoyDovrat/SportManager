package com.sportmanager.dto.response;

import java.math.BigDecimal;

public class ClothingPricingResponse {

    private Long id;
    private Long seasonId;
    private String seasonName;
    private BigDecimal shortKitPrice;
    private BigDecimal longKitPrice;
    private BigDecimal hoodiePrice;
    private Boolean allowAlreadyHasClothingSkip;
    private Boolean longKitPublicEnabled;
    private Boolean hoodiePublicEnabled;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSeasonId() {
        return seasonId;
    }

    public void setSeasonId(Long seasonId) {
        this.seasonId = seasonId;
    }

    public String getSeasonName() {
        return seasonName;
    }

    public void setSeasonName(String seasonName) {
        this.seasonName = seasonName;
    }

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
