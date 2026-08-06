package com.sportmanager.dto.request;

import com.sportmanager.enums.ClothingSize;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClothingOrderUpdateRequest {

    @NotNull(message = "alreadyHasClothing is required")
    private Boolean alreadyHasClothing;

    private Integer shortKitQuantity;
    private ClothingSize shortKitSize;

    private Integer longKitQuantity;
    private ClothingSize longKitSize;

    private Integer hoodieQuantity;
    private ClothingSize hoodieSize;

    private Integer shirtNumber;
}
