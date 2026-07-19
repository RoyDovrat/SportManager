package com.sportmanager.controller;

import com.sportmanager.dto.request.ClothingOrderRequest;
import com.sportmanager.service.ClothingOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clothing-orders")
@RequiredArgsConstructor
public class ClothingOrderController {

    private final ClothingOrderService clothingOrderService;

    @PostMapping
    public ResponseEntity<String> createClothingOrder(
            @Valid @RequestBody ClothingOrderRequest request
    ) {
        clothingOrderService.createClothingOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("Clothing order created successfully");
    }
}
