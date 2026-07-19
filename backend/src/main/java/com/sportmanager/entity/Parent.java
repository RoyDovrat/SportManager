package com.sportmanager.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "parents",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_parents_phone_number",
                columnNames = "phone_number"
        )
)
public class Parent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @NotBlank(message = "Phone number is required")
    @Column(name = "phone_number", nullable = false, unique = true)
    private String phoneNumber;

    @NotNull(message = "Is kibbutz member is required")
    @Column(name = "is_kibbutz_member", nullable = false)
    private Boolean isKibbutzMember;

    @Column(name = "budget_number")
    private String budgetNumber;

    @OneToMany(mappedBy = "parent")
    private List<Student> students;
}
