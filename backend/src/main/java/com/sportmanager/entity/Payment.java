package com.sportmanager.entity;

import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.PaymentMethod;
import com.sportmanager.enums.PaymentType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(
    name = "payments",
    uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_monthly_payment",
                    columnNames = {
                            "registration_id",
                            "charge_month",
                            "payment_type"
                    }
            )
    }
)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "registration_id", nullable = false)
    private Registration registration;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)    
    private BigDecimal amount;

    @Column(name = "charge_month")
    private LocalDate chargeMonth;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false)
    private PaymentType paymentType;

    @OneToOne
    @JoinColumn(name = "clothing_order_id", unique = true, nullable = true)
    private ClothingOrder clothingOrder;
}