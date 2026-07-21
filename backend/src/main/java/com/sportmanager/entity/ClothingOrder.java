package com.sportmanager.entity;

import com.sportmanager.enums.ClothingSize;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "clothing_orders",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_clothing_order_registration",
                columnNames = "registration_id"
        )
)
public class ClothingOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false)
    private Registration registration;

    @Column(name = "already_has_clothing", nullable = false, columnDefinition = "boolean not null default false")
    private Boolean alreadyHasClothing = false;

    @Column(name = "short_kit_quantity", nullable = false)
    private Integer shortKitQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "short_kit_size")
    private ClothingSize shortKitSize;

    @Column(name = "long_kit_quantity", nullable = false)
    private Integer longKitQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "long_kit_size")
    private ClothingSize longKitSize;

    @Column(name = "hoodie_quantity", nullable = false)
    private Integer hoodieQuantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "hoodie_size")
    private ClothingSize hoodieSize;

    @Column(name = "shirt_number")
    private Integer shirtNumber;

    @OneToOne(mappedBy = "clothingOrder")
    private Payment payment;
}
