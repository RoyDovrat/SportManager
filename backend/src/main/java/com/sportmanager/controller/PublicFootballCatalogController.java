package com.sportmanager.controller;

import com.sportmanager.dto.response.FootballCatalogResponse;
import com.sportmanager.service.FootballCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicFootballCatalogController {

    private final FootballCatalogService footballCatalogService;

    @GetMapping("/football-catalog")
    public ResponseEntity<FootballCatalogResponse> getFootballCatalog() {
        return ResponseEntity.ok(footballCatalogService.getActiveSeasonCatalog());
    }
}
