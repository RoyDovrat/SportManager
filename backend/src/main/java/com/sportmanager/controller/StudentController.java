package com.sportmanager.controller;

import com.sportmanager.dto.request.StudentUpdateRequest;
import com.sportmanager.entity.Student;
import com.sportmanager.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(
                studentService.getAllStudents()
        );
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<Student> getStudentById(
            @PathVariable Long studentId
    ) {
        return ResponseEntity.ok(
                studentService.getStudentById(studentId)
        );
    }

    @GetMapping("/identity/{identityNumber}")
    public ResponseEntity<Student> getStudentByIdentityNumber(
            @PathVariable String identityNumber
    ) {
        return ResponseEntity.ok(
                studentService.getStudentByIdentityNumber(
                        identityNumber
                )
        );
    }

    @PutMapping("/{studentId}")
    public ResponseEntity<Student> updateStudent(
            @PathVariable Long studentId,
            @Valid @RequestBody StudentUpdateRequest request
    ) {
        return ResponseEntity.ok(
                studentService.updateStudent(studentId, request)
        );
    }
}