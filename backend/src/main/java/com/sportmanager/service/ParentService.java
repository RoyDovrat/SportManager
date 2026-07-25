package com.sportmanager.service;

import com.sportmanager.dto.request.ParentUpdateRequest;
import com.sportmanager.dto.response.ParentResponse;
import com.sportmanager.dto.response.StudentResponse;
import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Student;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ParentRepository;
import com.sportmanager.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ParentService {

    private final ParentRepository parentRepository;
    private final StudentRepository studentRepository;

    public ParentService(
            ParentRepository parentRepository,
            StudentRepository studentRepository
    ) {
        this.parentRepository = parentRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional(readOnly = true)
    public List<ParentResponse> getParents(String search, Boolean isKibbutzMember) {
        String normalizedSearch = normalizeSearch(search);
        return parentRepository.search(normalizedSearch, isKibbutzMember).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ParentResponse getParentById(Long parentId) {
        return toResponse(getParentEntity(parentId));
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> getStudentsByParentId(Long parentId) {
        getParentEntity(parentId);
        return studentRepository.findByParentId(parentId).stream()
                .map(this::toStudentResponse)
                .toList();
    }

    @Transactional
    public ParentResponse updateParent(Long parentId, ParentUpdateRequest request) {
        Parent parent = getParentEntity(parentId);

        validatePhoneNumberIsAvailable(request.getPhoneNumber(), parentId);
        validateBudgetDetails(request);

        parent.setFirstName(request.getFirstName());
        parent.setLastName(request.getLastName());
        parent.setPhoneNumber(request.getPhoneNumber());
        parent.setIsKibbutzMember(request.getIsKibbutzMember());

        if (Boolean.TRUE.equals(request.getIsKibbutzMember())) {
            parent.setBudgetNumber(request.getBudgetNumber());
        } else {
            parent.setBudgetNumber(null);
        }

        return toResponse(parentRepository.save(parent));
    }

    public Parent getParentEntity(Long parentId) {
        return parentRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Parent was not found with id: " + parentId
                ));
    }

    private void validatePhoneNumberIsAvailable(String phoneNumber, Long parentId) {
        if (parentRepository.existsByPhoneNumberAndIdNot(phoneNumber, parentId)) {
            throw new ConflictException(
                    "Another parent already exists with this phone number"
            );
        }
    }

    private void validateBudgetDetails(ParentUpdateRequest request) {
        if (Boolean.TRUE.equals(request.getIsKibbutzMember())
                && isBlank(request.getBudgetNumber())) {
            throw new BusinessRuleException(
                    "Budget number is required for a kibbutz member"
            );
        }
    }

    private ParentResponse toResponse(Parent parent) {
        int studentCount = studentRepository.findByParentId(parent.getId()).size();
        return ParentResponse.builder()
                .id(parent.getId())
                .firstName(parent.getFirstName())
                .lastName(parent.getLastName())
                .phoneNumber(parent.getPhoneNumber())
                .isKibbutzMember(parent.getIsKibbutzMember())
                .budgetNumber(parent.getBudgetNumber())
                .studentCount(studentCount)
                .build();
    }

    private StudentResponse toStudentResponse(Student student) {
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

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
