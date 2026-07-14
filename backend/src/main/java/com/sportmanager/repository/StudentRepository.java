package com.sportmanager.repository;

import com.sportmanager.entity.Student;
import com.sportmanager.entity.Parent;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByParentId(Long parentId);

    Optional<Student> findByParentAndFirstNameAndLastName(Parent parent, String firstName, String lastName);

    Optional<Student> findByIdentityNumber(String identityNumber);
}