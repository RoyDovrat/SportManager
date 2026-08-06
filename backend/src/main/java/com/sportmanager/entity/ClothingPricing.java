package com.sportmanager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;

@Entity
@Table(
        name = "clothing_pricing",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_clothing_pricing_season",
                        columnNames = "season_id"
                )
        }
)
public class ClothingPricing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @Column(name = "short_kit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal shortKitPrice;

    @Column(name = "long_kit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal longKitPrice;

    @Column(name = "hoodie_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal hoodiePrice;

    /**
     * When true (or null), public clothing form may offer "already has clothing" skip.
     */
    @Column(name = "allow_already_has_clothing_skip")
    private Boolean allowAlreadyHasClothingSkip = true;

    /**
     * When true (or null), public form may offer long kit. Short kit is always offered.
     */
    @Column(name = "long_kit_public_enabled")
    private Boolean longKitPublicEnabled = true;

    /**
     * When true (or null), public form may offer hoodie. Short kit is always offered.
     */
    @Column(name = "hoodie_public_enabled")
    private Boolean hoodiePublicEnabled = true;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Season getSeason() {
        return season;
    }

    public void setSeason(Season season) {
        this.season = season;
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
