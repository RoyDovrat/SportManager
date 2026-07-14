package com.sportmanager.dto.request;

import com.sportmanager.enums.ClothingSize;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClothingOrderRequest {

    private String studentIdentityNumber;
    private Long seasonId;

    private Integer shortKitQuantity;
    private ClothingSize shortKitSize;

    private Integer longKitQuantity;
    private ClothingSize longKitSize;

    private Integer hoodieQuantity;
    private ClothingSize hoodieSize;

    private Integer shirtNumber;
}