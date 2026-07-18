package com.sportmanager.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class MonthlyPaymentRequest {

    @NotNull
    private Long registrationId;

    @NotNull
    private LocalDate chargeMonth;
}
