package com.sportmanager.controller;

import com.sportmanager.dto.response.SwimmingCatalogResponse;
import com.sportmanager.service.SwimmingCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicSwimmingCatalogController {

    private final SwimmingCatalogService swimmingCatalogService;

    @GetMapping("/swimming-catalog")
    public ResponseEntity<SwimmingCatalogResponse> getSwimmingCatalog() {
        return ResponseEntity.ok(swimmingCatalogService.getActiveSeasonCatalog());
    }
}
