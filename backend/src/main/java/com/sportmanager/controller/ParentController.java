package com.sportmanager.controller;

import com.sportmanager.dto.request.ParentUpdateRequest;
import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Student;
import com.sportmanager.service.ParentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parents")
@RequiredArgsConstructor
public class ParentController {

    private final ParentService parentService;

    @GetMapping
    public ResponseEntity<List<Parent>> getAllParents() {
        return ResponseEntity.ok(
                parentService.getAllParents()
        );
    }

    @GetMapping("/{parentId}")
    public ResponseEntity<Parent> getParentById(
            @PathVariable Long parentId
    ) {
        return ResponseEntity.ok(
                parentService.getParentById(parentId)
        );
    }

    @GetMapping("/{parentId}/students")
    public ResponseEntity<List<Student>> getStudentsByParentId(
            @PathVariable Long parentId
    ) {
        return ResponseEntity.ok(
                parentService.getStudentsByParentId(parentId)
        );
    }

    @PutMapping("/{parentId}")
    public ResponseEntity<Parent> updateParent(
            @PathVariable Long parentId,
            @Valid @RequestBody ParentUpdateRequest request
    ) {
        return ResponseEntity.ok(
                parentService.updateParent(parentId, request)
        );
    }
}