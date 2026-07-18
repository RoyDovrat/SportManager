package com.sportmanager.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

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

}