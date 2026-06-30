package com.sportmanager.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Student;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Activity;
import java.util.List;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByStudent(Student student);

    List<Registration> findBySeason(Season season);

    List<Registration> findByActivity(Activity activity);

    boolean existsByStudentAndActivityAndSeason(
            Student student,
            Activity activity,
            Season season
    );
}
