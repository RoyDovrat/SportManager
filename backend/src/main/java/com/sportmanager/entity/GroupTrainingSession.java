package com.sportmanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "group_training_sessions",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_group_training_session_day_start",
                columnNames = {"activity_group_id", "day_of_week", "start_time"}
        )
)
public class GroupTrainingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activity_group_id", nullable = false)
    private ActivityGroup activityGroup;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
