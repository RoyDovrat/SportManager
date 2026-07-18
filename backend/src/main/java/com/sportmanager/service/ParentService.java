package com.sportmanager.service;

import com.sportmanager.dto.request.ParentUpdateRequest;
import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Student;
import com.sportmanager.repository.ParentRepository;
import com.sportmanager.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ParentService {

    private final ParentRepository parentRepository;
    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public List<Parent> getAllParents() {
        return parentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Parent getParentById(Long parentId) {
        return parentRepository.findById(parentId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Parent was not found with id: " + parentId
                        )
                );
    }

    @Transactional(readOnly = true)
    public List<Student> getStudentsByParentId(Long parentId) {

        getParentById(parentId);

        return studentRepository.findByParentId(parentId);
    }

    @Transactional
    public Parent updateParent(
            Long parentId,
            ParentUpdateRequest request
    ) {
        Parent parent = getParentById(parentId);

        validatePhoneNumberIsAvailable(
                request.getPhoneNumber(),
                parentId
        );

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

        return parentRepository.save(parent);
    }

    private void validatePhoneNumberIsAvailable(
            String phoneNumber,
            Long parentId
    ) {
        boolean phoneNumberExists =
                parentRepository.existsByPhoneNumberAndIdNot(
                        phoneNumber,
                        parentId
                );

        if (phoneNumberExists) {
            throw new RuntimeException(
                    "Another parent already exists with this phone number"
            );
        }
    }

    private void validateBudgetDetails(
            ParentUpdateRequest request
    ) {
        if (Boolean.TRUE.equals(request.getIsKibbutzMember())
                && isBlank(request.getBudgetNumber())) {

            throw new RuntimeException(
                    "Budget number is required for a kibbutz member"
            );
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}