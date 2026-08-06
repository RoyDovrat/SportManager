package com.sportmanager.controller;

import com.sportmanager.dto.request.SeasonRequest;
import com.sportmanager.dto.response.SeasonResponse;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.service.SeasonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seasons")
@RequiredArgsConstructor
public class SeasonController {

    private final SeasonService seasonService;

    @PostMapping
    public ResponseEntity<SeasonResponse> createSeason(
            @Valid @RequestBody SeasonRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(seasonService.createSeason(request));
    }

    @GetMapping
    public ResponseEntity<List<SeasonResponse>> getAllSeasons() {
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    @GetMapping("/active")
    public ResponseEntity<List<SeasonResponse>> getActiveSeasons() {
        return ResponseEntity.ok(seasonService.getActiveSeasons());
    }

    @GetMapping("/active/{activityType}")
    public ResponseEntity<SeasonResponse> getActiveSeasonByType(
            @PathVariable ActivityType activityType
    ) {
        return ResponseEntity.ok(seasonService.getActiveSeason(activityType));
    }

    @GetMapping("/{seasonId}")
    public ResponseEntity<SeasonResponse> getSeasonById(
            @PathVariable Long seasonId
    ) {
        return ResponseEntity.ok(seasonService.getSeasonById(seasonId));
    }

    @PutMapping("/{seasonId}")
    public ResponseEntity<SeasonResponse> updateSeason(
            @PathVariable Long seasonId,
            @Valid @RequestBody SeasonRequest request
    ) {
        return ResponseEntity.ok(
                seasonService.updateSeason(seasonId, request)
        );
    }

    @PatchMapping("/{seasonId}/activate")
    public ResponseEntity<SeasonResponse> activateSeason(
            @PathVariable Long seasonId
    ) {
        return ResponseEntity.ok(seasonService.activateSeason(seasonId));
    }

    @PatchMapping("/{seasonId}/deactivate")
    public ResponseEntity<SeasonResponse> deactivateSeason(
            @PathVariable Long seasonId
    ) {
        return ResponseEntity.ok(seasonService.deactivateSeason(seasonId));
    }
}
