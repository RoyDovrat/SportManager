package com.sportmanager.service;

import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.BusinessRuleException;

import com.sportmanager.dto.request.StudentUpdateRequest;
import com.sportmanager.entity.Student;
import com.sportmanager.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Student getStudentById(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student was not found with id: " + studentId
                        )
                );
    }

    @Transactional(readOnly = true)
    public Student getStudentByIdentityNumber(
            String identityNumber
    ) {
        return studentRepository.findByIdentityNumber(identityNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student was not found with identity number: "
                                        + identityNumber
                        )
                );
    }

    @Transactional
    public Student updateStudent(
            Long studentId,
            StudentUpdateRequest request
    ) {
        Student student = getStudentById(studentId);

        validateIdentityNumberIsAvailable(
                request.getIdentityNumber(),
                studentId
        );

        validateAge(request.getAge());

        student.setIdentityNumber(request.getIdentityNumber());
        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setGender(request.getGender());
        student.setAge(request.getAge());
        student.setAgeGroup(request.getAgeGroup());

        return studentRepository.save(student);
    }

    private void validateIdentityNumberIsAvailable(
            String identityNumber,
            Long studentId
    ) {
        boolean identityNumberExists =
                studentRepository.existsByIdentityNumberAndIdNot(
                        identityNumber,
                        studentId
                );

        if (identityNumberExists) {
            throw new ConflictException(
                    "Another student already exists with this identity number"
            );
        }
    }

    private void validateAge(Integer age) {
        if (age == null || age <= 0) {
            throw new BusinessRuleException(
                    "Student age must be greater than zero"
            );
        }
    }
}