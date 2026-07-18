package com.sportmanager.controller;

import com.sportmanager.dto.request.SeasonRequest;
import com.sportmanager.entity.Season;
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
    public ResponseEntity<Season> createSeason(
            @Valid @RequestBody SeasonRequest request
    ) {
        Season createdSeason =
                seasonService.createSeason(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdSeason);
    }

    @GetMapping
    public ResponseEntity<List<Season>> getAllSeasons() {
        return ResponseEntity.ok(
                seasonService.getAllSeasons()
        );
    }

    @GetMapping("/{seasonId}")
    public ResponseEntity<Season> getSeasonById(
            @PathVariable Long seasonId
    ) {
        return ResponseEntity.ok(
                seasonService.getSeasonById(seasonId)
        );
    }

    @GetMapping("/active")
    public ResponseEntity<Season> getActiveSeason() {
        return ResponseEntity.ok(
                seasonService.getActiveSeason()
        );
    }

    @PutMapping("/{seasonId}")
    public ResponseEntity<Season> updateSeason(
            @PathVariable Long seasonId,
            @Valid @RequestBody SeasonRequest request
    ) {
        return ResponseEntity.ok(
                seasonService.updateSeason(
                        seasonId,
                        request
                )
        );
    }

    @PatchMapping("/{seasonId}/activate")
    public ResponseEntity<Season> activateSeason(
            @PathVariable Long seasonId
    ) {
        return ResponseEntity.ok(
                seasonService.activateSeason(seasonId)
        );
    }

    @PatchMapping("/{seasonId}/deactivate")
    public ResponseEntity<Season> deactivateSeason(
            @PathVariable Long seasonId
    ) {
        return ResponseEntity.ok(
                seasonService.deactivateSeason(seasonId)
        );
    }
}