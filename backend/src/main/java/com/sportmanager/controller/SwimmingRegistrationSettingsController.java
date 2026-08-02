package com.sportmanager.controller;

import com.sportmanager.dto.request.SwimmingRegistrationSettingsRequest;
import com.sportmanager.dto.request.SwimmingRegistrationSettingsUpdateRequest;
import com.sportmanager.dto.response.SwimmingRegistrationSettingsResponse;
import com.sportmanager.service.SwimmingRegistrationSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/swimming-registration-settings")
@RequiredArgsConstructor
public class SwimmingRegistrationSettingsController {

    private final SwimmingRegistrationSettingsService settingsService;

    @PostMapping
    public ResponseEntity<SwimmingRegistrationSettingsResponse> create(
            @Valid @RequestBody SwimmingRegistrationSettingsRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(settingsService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<SwimmingRegistrationSettingsResponse>> getAll() {
        return ResponseEntity.ok(settingsService.getAll());
    }

    @GetMapping("/{settingsId}")
    public ResponseEntity<SwimmingRegistrationSettingsResponse> getById(
            @PathVariable Long settingsId
    ) {
        return ResponseEntity.ok(settingsService.getById(settingsId));
    }

    @GetMapping("/season/{seasonId}")
    public ResponseEntity<SwimmingRegistrationSettingsResponse> getBySeason(
            @PathVariable Long seasonId
    ) {
        return ResponseEntity.ok(settingsService.getBySeason(seasonId));
    }

    @PutMapping("/{settingsId}")
    public ResponseEntity<SwimmingRegistrationSettingsResponse> update(
            @PathVariable Long settingsId,
            @Valid @RequestBody SwimmingRegistrationSettingsUpdateRequest request
    ) {
        return ResponseEntity.ok(settingsService.update(settingsId, request));
    }
}
