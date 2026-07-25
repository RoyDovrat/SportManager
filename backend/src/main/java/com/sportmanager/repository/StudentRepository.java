package com.sportmanager.repository;

import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.AgeGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByParentId(Long parentId);

    Optional<Student> findByParentAndFirstNameAndLastName(Parent parent, String firstName, String lastName);

    Optional<Student> findByIdentityNumber(String identityNumber);

    boolean existsByIdentityNumber(String identityNumber);

    boolean existsByIdentityNumberAndIdNot(String identityNumber, Long id);

    @Query("""
            SELECT s FROM Student s
            JOIN FETCH s.parent p
            WHERE (:search IS NULL OR :search = ''
                OR LOWER(s.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(s.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
                OR s.identityNumber LIKE CONCAT('%', :search, '%'))
              AND (:ageGroup IS NULL OR s.ageGroup = :ageGroup)
              AND (:parentId IS NULL OR p.id = :parentId)
            ORDER BY s.lastName, s.firstName
            """)
    List<Student> search(
            @Param("search") String search,
            @Param("ageGroup") AgeGroup ageGroup,
            @Param("parentId") Long parentId
    );
}
