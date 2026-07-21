package com.sportmanager.repository;

import com.sportmanager.entity.Activity;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByStudent(Student student);

    List<Registration> findBySeason(Season season);

    List<Registration> findBySeasonId(Long seasonId);

    List<Registration> findByActivity(Activity activity);

    List<Registration> findByStatus(RegistrationStatus status);

    List<Registration> findBySeasonIdAndStatus(Long seasonId, RegistrationStatus status);

    List<Registration> findByActivityGroupId(Long activityGroupId);

    boolean existsByStudentAndActivityAndSeason(
            Student student,
            Activity activity,
            Season season
    );

    Optional<Registration> findByStudentAndActivityAndSeason(
            Student student,
            Activity activity,
            Season season
    );
}
