package com.sportmanager.controller;

import com.sportmanager.dto.request.RegistrationRequest;
import com.sportmanager.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping
    public ResponseEntity<String> createRegistration(
            @RequestBody RegistrationRequest request
    ) {
        registrationService.createRegistration(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("Registration completed successfully");
    }
}