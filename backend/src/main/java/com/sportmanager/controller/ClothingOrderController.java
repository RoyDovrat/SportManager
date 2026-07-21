package com.sportmanager.controller;

import com.sportmanager.dto.request.ClothingOrderRequest;
import com.sportmanager.dto.response.ClothingOrderResponse;
import com.sportmanager.service.ClothingOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clothing-orders")
@RequiredArgsConstructor
public class ClothingOrderController {

    private final ClothingOrderService clothingOrderService;

    @PostMapping
    public ResponseEntity<ClothingOrderResponse> createClothingOrder(
            @Valid @RequestBody ClothingOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clothingOrderService.createClothingOrder(request));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ClothingOrderResponse> getClothingOrderById(
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(clothingOrderService.getClothingOrderById(orderId));
    }

    @GetMapping
    public ResponseEntity<List<ClothingOrderResponse>> getClothingOrders(
            @RequestParam(required = false) Long seasonId,
            @RequestParam(required = false) String studentIdentityNumber
    ) {
        return ResponseEntity.ok(
                clothingOrderService.getClothingOrders(seasonId, studentIdentityNumber)
        );
    }
}
