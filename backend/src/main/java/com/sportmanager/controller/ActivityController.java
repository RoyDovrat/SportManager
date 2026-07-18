package com.sportmanager.controller;

import com.sportmanager.dto.request.ActivityRequest;
import com.sportmanager.entity.Activity;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<Activity> createActivity(
            @Valid @RequestBody ActivityRequest request
    ) {
        Activity createdActivity =
                activityService.createActivity(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdActivity);
    }

    @GetMapping
    public ResponseEntity<List<Activity>> getAllActivities() {
        return ResponseEntity.ok(
                activityService.getAllActivities()
        );
    }

    @GetMapping("/active")
    public ResponseEntity<List<Activity>> getActiveActivities() {
        return ResponseEntity.ok(
                activityService.getActiveActivities()
        );
    }

    @GetMapping("/{activityId}")
    public ResponseEntity<Activity> getActivityById(
            @PathVariable Long activityId
    ) {
        return ResponseEntity.ok(
                activityService.getActivityById(activityId)
        );
    }

    @GetMapping("/type/{activityType}")
    public ResponseEntity<Activity> getActivityByType(
            @PathVariable ActivityType activityType
    ) {
        return ResponseEntity.ok(
                activityService.getActivityByType(activityType)
        );
    }

    @PutMapping("/{activityId}")
    public ResponseEntity<Activity> updateActivity(
            @PathVariable Long activityId,
            @Valid @RequestBody ActivityRequest request
    ) {
        return ResponseEntity.ok(
                activityService.updateActivity(
                        activityId,
                        request
                )
        );
    }

    @PatchMapping("/{activityId}/activate")
    public ResponseEntity<Activity> activateActivity(
            @PathVariable Long activityId
    ) {
        return ResponseEntity.ok(
                activityService.activateActivity(activityId)
        );
    }

    @PatchMapping("/{activityId}/deactivate")
    public ResponseEntity<Activity> deactivateActivity(
            @PathVariable Long activityId
    ) {
        return ResponseEntity.ok(
                activityService.deactivateActivity(activityId)
        );
    }
}