package com.sportmanager.controller;

import com.sportmanager.dto.request.StudentUpdateRequest;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.dto.response.StudentResponse;
import com.sportmanager.enums.AgeGroup;
import com.sportmanager.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<StudentResponse>> getStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AgeGroup ageGroup,
            @RequestParam(required = false) Long parentId
    ) {
        return ResponseEntity.ok(studentService.getStudents(search, ageGroup, parentId));
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<StudentResponse> getStudentById(
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(studentService.getStudentById(studentId));
    }

    @GetMapping("/identity/{identityNumber}")
    public ResponseEntity<StudentResponse> getStudentByIdentityNumber(
            @PathVariable String identityNumber
    ) {
        return ResponseEntity.ok(studentService.getStudentByIdentityNumber(identityNumber));
    }

    @GetMapping("/{studentId}/registrations")
    public ResponseEntity<List<RegistrationResponse>> getStudentRegistrations(
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(studentService.getStudentRegistrations(studentId));
    }

    @PutMapping("/{studentId}")
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable Long studentId,
            @Valid @RequestBody StudentUpdateRequest request
    ) {
        return ResponseEntity.ok(studentService.updateStudent(studentId, request));
    }
}
