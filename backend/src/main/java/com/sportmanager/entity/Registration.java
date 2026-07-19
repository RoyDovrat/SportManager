package com.sportmanager.entity;

import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "registrations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_registration_student_activity_season",
                columnNames = {"student_id", "activity_id", "season_id"}
        )
)
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @NotNull
    @Column(name = "registration_date", nullable = false)
    private LocalDate registrationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "swimming_lesson_type")
    private SwimmingLessonType swimmingLessonType;

    @Enumerated(EnumType.STRING)
    @Column(name = "water_adaptation_level")
    private WaterAdaptationLevel waterAdaptationLevel;

    @Column(name = "health_declaration_approved", nullable = false)
    private Boolean healthDeclarationApproved;

    @Column(name = "has_medical_limitation", nullable = false)
    private Boolean hasMedicalLimitation;

    @Column(name = "medical_notes")
    private String medicalNotes;

    @Column(name = "special_requests")
    private String specialRequests;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RegistrationStatus status;

    @OneToMany(mappedBy = "registration")
    private List<Payment> payments;

    @OneToMany(mappedBy = "registration")
    private List<ClothingOrder> clothingOrders;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_pricing_id", nullable = false)
    private ActivityPricing activityPricing;
}
