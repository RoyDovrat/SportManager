package com.sportmanager.dto.request;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClothingPaymentRequest {

    @NotNull
    private Long clothingOrderId;
}
