package com.sportmanager.controller;

import com.sportmanager.dto.request.RegistrationRequest;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping
    public ResponseEntity<RegistrationResponse> createRegistration(
            @Valid @RequestBody RegistrationRequest request
    ) {
        RegistrationResponse response = registrationService.createRegistration(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{registrationId}")
    public ResponseEntity<RegistrationResponse> getRegistrationById(
            @PathVariable Long registrationId
    ) {
        return ResponseEntity.ok(registrationService.getRegistrationById(registrationId));
    }

    @GetMapping
    public ResponseEntity<List<RegistrationResponse>> getRegistrations(
            @RequestParam(required = false) Long seasonId,
            @RequestParam(required = false) RegistrationStatus status
    ) {
        return ResponseEntity.ok(registrationService.getRegistrations(seasonId, status));
    }
}
