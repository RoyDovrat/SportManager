package com.sportmanager.controller;

import com.sportmanager.dto.request.ParentUpdateRequest;
import com.sportmanager.dto.response.ParentResponse;
import com.sportmanager.dto.response.StudentResponse;
import com.sportmanager.service.ParentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parents")
public class ParentController {

    private final ParentService parentService;

    public ParentController(ParentService parentService) {
        this.parentService = parentService;
    }

    @GetMapping
    public ResponseEntity<List<ParentResponse>> getParents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isKibbutzMember
    ) {
        return ResponseEntity.ok(parentService.getParents(search, isKibbutzMember));
    }

    @GetMapping("/{parentId}")
    public ResponseEntity<ParentResponse> getParentById(
            @PathVariable Long parentId
    ) {
        return ResponseEntity.ok(parentService.getParentById(parentId));
    }

    @GetMapping("/{parentId}/students")
    public ResponseEntity<List<StudentResponse>> getStudentsByParentId(
            @PathVariable Long parentId
    ) {
        return ResponseEntity.ok(parentService.getStudentsByParentId(parentId));
    }

    @PutMapping("/{parentId}")
    public ResponseEntity<ParentResponse> updateParent(
            @PathVariable Long parentId,
            @Valid @RequestBody ParentUpdateRequest request
    ) {
        return ResponseEntity.ok(parentService.updateParent(parentId, request));
    }
}
