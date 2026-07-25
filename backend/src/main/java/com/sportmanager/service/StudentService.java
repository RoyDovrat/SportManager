package com.sportmanager.service;

import com.sportmanager.dto.request.StudentUpdateRequest;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.dto.response.StudentResponse;
import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final RegistrationRepository registrationRepository;
    private final RegistrationService registrationService;

    public StudentService(
            StudentRepository studentRepository,
            RegistrationRepository registrationRepository,
            RegistrationService registrationService
    ) {
        this.studentRepository = studentRepository;
        this.registrationRepository = registrationRepository;
        this.registrationService = registrationService;
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> getStudents(
            String search,
            AgeGroup ageGroup,
            Long parentId
    ) {
        String normalizedSearch = normalizeSearch(search);
        return studentRepository.search(normalizedSearch, ageGroup, parentId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long studentId) {
        return toResponse(getStudentEntity(studentId));
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentByIdentityNumber(String identityNumber) {
        Student student = studentRepository.findByIdentityNumber(identityNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student was not found with identity number: " + identityNumber
                ));
        return toResponse(student);
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getStudentRegistrations(Long studentId) {
        getStudentEntity(studentId);
        return registrationRepository.findByStudentId(studentId).stream()
                .map(registrationService::toResponse)
                .toList();
    }

    @Transactional
    public StudentResponse updateStudent(Long studentId, StudentUpdateRequest request) {
        Student student = getStudentEntity(studentId);

        validateIdentityNumberIsAvailable(request.getIdentityNumber(), studentId);
        validateAge(request.getAge());

        student.setIdentityNumber(request.getIdentityNumber());
        student.setFirstName(request.getFirstName());
        student.setLastName(request.getLastName());
        student.setGender(request.getGender());
        student.setAge(request.getAge());
        student.setAgeGroup(request.getAgeGroup());

        return toResponse(studentRepository.save(student));
    }

    public Student getStudentEntity(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student was not found with id: " + studentId
                ));
    }

    private void validateIdentityNumberIsAvailable(String identityNumber, Long studentId) {
        if (studentRepository.existsByIdentityNumberAndIdNot(identityNumber, studentId)) {
            throw new ConflictException(
                    "Another student already exists with this identity number"
            );
        }
    }

    private void validateAge(Integer age) {
        if (age == null || age <= 0) {
            throw new BusinessRuleException("Student age must be greater than zero");
        }
    }

    private StudentResponse toResponse(Student student) {
        Parent parent = student.getParent();
        return StudentResponse.builder()
                .id(student.getId())
                .identityNumber(student.getIdentityNumber())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .gender(student.getGender())
                .age(student.getAge())
                .ageGroup(student.getAgeGroup())
                .parentId(parent.getId())
                .parentFirstName(parent.getFirstName())
                .parentLastName(parent.getLastName())
                .parentPhoneNumber(parent.getPhoneNumber())
                .isKibbutzMember(parent.getIsKibbutzMember())
                .build();
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim();
    }
}
