package com.sportmanager.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "swimming_registration_settings",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_swimming_registration_settings_season",
                        columnNames = "season_id"
                )
        }
)
public class SwimmingRegistrationSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    /**
     * Public swimming registration intro (Markdown), edited by the principal/admin.
     */
    @Column(name = "intro_markdown", columnDefinition = "TEXT")
    private String introMarkdown;

    /**
     * Fixed weekly sessions for GROUP swimming lessons (default 2).
     */
    @Column(name = "group_weekly_sessions")
    private Integer groupWeeklySessions = 2;
}
