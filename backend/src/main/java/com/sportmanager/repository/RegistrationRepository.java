package com.sportmanager.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Student;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Activity;
import com.sportmanager.enums.RegistrationStatus;
import java.util.List;
import java.util.Optional;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByStudent(Student student);

    List<Registration> findBySeason(Season season);

    List<Registration> findByActivity(Activity activity);

    List<Registration> findByStatus(RegistrationStatus status);

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
