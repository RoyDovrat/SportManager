package com.sportmanager.controller;

import com.sportmanager.dto.request.ActivityGroupRequest;
import com.sportmanager.dto.request.ActivityGroupUpdateRequest;
import com.sportmanager.dto.response.ActivityGroupResponse;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.service.ActivityGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activity-groups")
@RequiredArgsConstructor
public class ActivityGroupController {

    private final ActivityGroupService activityGroupService;

    @PostMapping
    public ResponseEntity<ActivityGroupResponse> createGroup(
            @Valid @RequestBody ActivityGroupRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityGroupService.createGroup(request));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<ActivityGroupResponse> getGroupById(
            @PathVariable Long groupId
    ) {
        return ResponseEntity.ok(activityGroupService.getGroupById(groupId));
    }

    @GetMapping
    public ResponseEntity<List<ActivityGroupResponse>> getGroups(
            @RequestParam Long seasonId,
            @RequestParam(required = false) Long activityId,
            @RequestParam(required = false) Boolean activeOnly
    ) {
        return ResponseEntity.ok(
                activityGroupService.getGroups(seasonId, activityId, activeOnly)
        );
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<ActivityGroupResponse> updateGroup(
            @PathVariable Long groupId,
            @Valid @RequestBody ActivityGroupUpdateRequest request
    ) {
        return ResponseEntity.ok(activityGroupService.updateGroup(groupId, request));
    }

    @PatchMapping("/{groupId}/activate")
    public ResponseEntity<ActivityGroupResponse> activateGroup(
            @PathVariable Long groupId
    ) {
        return ResponseEntity.ok(activityGroupService.activateGroup(groupId));
    }

    @PatchMapping("/{groupId}/deactivate")
    public ResponseEntity<ActivityGroupResponse> deactivateGroup(
            @PathVariable Long groupId
    ) {
        return ResponseEntity.ok(activityGroupService.deactivateGroup(groupId));
    }

    @GetMapping("/{groupId}/registrations")
    public ResponseEntity<List<RegistrationResponse>> getGroupRegistrations(
            @PathVariable Long groupId
    ) {
        return ResponseEntity.ok(activityGroupService.getGroupRegistrations(groupId));
    }

    @PostMapping("/{groupId}/registrations/{registrationId}")
    public ResponseEntity<RegistrationResponse> assignRegistration(
            @PathVariable Long groupId,
            @PathVariable Long registrationId
    ) {
        return ResponseEntity.ok(
                activityGroupService.assignRegistrationToGroup(registrationId, groupId)
        );
    }

    @DeleteMapping("/registrations/{registrationId}")
    public ResponseEntity<RegistrationResponse> unassignRegistration(
            @PathVariable Long registrationId
    ) {
        return ResponseEntity.ok(
                activityGroupService.unassignRegistrationFromGroup(registrationId)
        );
    }
}
