package com.sportmanager.entity;

import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.enums.SwimmingLessonType;
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
@Table(name = "registrations")
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @NotNull
    @Column(name = "registration_date", nullable = false)
    private LocalDate registrationDate;

    @Column(name = "football_trainings_per_week")
    private Integer footballTrainingsPerWeek;

    @Enumerated(EnumType.STRING)
    @Column(name = "swimming_lesson_type")
    private SwimmingLessonType swimmingLessonType;

    @Column(name = "health_declaration_approved", nullable = false)
    private Boolean healthDeclarationApproved;

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
}