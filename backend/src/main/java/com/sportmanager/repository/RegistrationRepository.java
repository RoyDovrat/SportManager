package com.sportmanager.repository;

import com.sportmanager.entity.Activity;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    List<Registration> findByStudent(Student student);

    List<Registration> findByStudentId(Long studentId);

    List<Registration> findBySeason(Season season);

    List<Registration> findBySeasonId(Long seasonId);

    List<Registration> findByActivity(Activity activity);

    List<Registration> findByStatus(RegistrationStatus status);

    List<Registration> findBySeasonIdAndStatus(Long seasonId, RegistrationStatus status);

    List<Registration> findByActivityGroupId(Long activityGroupId);

    long countBySeasonId(Long seasonId);

    long countBySeasonIdAndStatus(Long seasonId, RegistrationStatus status);

    @Query("""
            SELECT COUNT(DISTINCT r.student.id)
            FROM Registration r
            WHERE r.season.id = :seasonId
              AND r.status = :status
            """)
    long countDistinctStudentsBySeasonIdAndStatus(
            @Param("seasonId") Long seasonId,
            @Param("status") RegistrationStatus status
    );

    List<Registration> findByRegistrationDateOrderByIdDesc(LocalDate registrationDate);

    List<Registration> findBySeasonIdAndRegistrationDateOrderByIdDesc(
            Long seasonId,
            LocalDate registrationDate
    );

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
