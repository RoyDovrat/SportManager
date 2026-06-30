package com.sportmanager.repository;

import com.sportmanager.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByParentId(Long parentId);

}