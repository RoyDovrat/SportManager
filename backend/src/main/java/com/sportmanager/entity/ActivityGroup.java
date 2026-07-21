package com.sportmanager.entity;

import com.sportmanager.enums.AgeGroup;
import com.sportmanager.enums.SwimmingLessonType;
import com.sportmanager.enums.WaterAdaptationLevel;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "activity_groups",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_activity_group_season_activity_name",
                columnNames = {"season_id", "activity_id", "name"}
        )
)
public class ActivityGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Enumerated(EnumType.STRING)
    @Column(name = "age_group")
    private AgeGroup ageGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "swimming_lesson_type")
    private SwimmingLessonType swimmingLessonType;

    @Enumerated(EnumType.STRING)
    @Column(name = "water_adaptation_level")
    private WaterAdaptationLevel waterAdaptationLevel;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "activityGroup")
    private List<Registration> registrations = new ArrayList<>();
}
