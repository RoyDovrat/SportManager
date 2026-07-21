package com.sportmanager.dto.response;

import com.sportmanager.enums.ClothingSize;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ClothingOrderResponse {

    private Long id;
    private Long registrationId;
    private Long studentId;
    private String studentIdentityNumber;
    private String studentFirstName;
    private String studentLastName;
    private Long seasonId;
    private String seasonName;
    private Boolean alreadyHasClothing;
    private Integer shortKitQuantity;
    private ClothingSize shortKitSize;
    private Integer longKitQuantity;
    private ClothingSize longKitSize;
    private Integer hoodieQuantity;
    private ClothingSize hoodieSize;
    private Integer shirtNumber;
    private boolean clothingPaymentRequired;
}
