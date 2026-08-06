package com.sportmanager.entity;

import com.sportmanager.enums.SwimmingLessonType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "activity_pricing")
public class ActivityPricing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @ManyToOne
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Enumerated(EnumType.STRING)
    @Column(name = "swimming_lesson_type")
    private SwimmingLessonType swimmingLessonType;

    /**
     * Football: practice count key (1 or 2).
     * Swimming: always 1 (unit weekly price row for the lesson type).
     */
    @Column(name = "weekly_sessions")
    private Integer weeklySessions;

    /**
     * Weekly rate for this pricing key (DB column kept as monthly_price for compatibility).
     * Football: weekly package for that practice count.
     * Swimming: weekly unit for one lesson of this type.
     * Parent monthly charge = weekly rate (× swimming sessions if needed) × weeks in month.
     */
    @Column(name = "monthly_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyPrice;

    @OneToMany(mappedBy = "activityPricing")
    private List<Registration> registrations;
}
