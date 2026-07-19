package com.sportmanager.dto.request;

import com.sportmanager.enums.ClothingSize;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClothingOrderRequest {

    @NotBlank(message = "Student identity number is required")
    private String studentIdentityNumber;

    @NotNull(message = "Season id is required")
    private Long seasonId;

    private Integer shortKitQuantity;
    private ClothingSize shortKitSize;

    private Integer longKitQuantity;
    private ClothingSize longKitSize;

    private Integer hoodieQuantity;
    private ClothingSize hoodieSize;

    private Integer shirtNumber;
}
