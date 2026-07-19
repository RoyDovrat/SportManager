package com.sportmanager.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class MonthlyPaymentRequest {

    @NotNull(message = "Registration id is required")
    private Long registrationId;

    @NotNull(message = "Charge month is required")
    private LocalDate chargeMonth;
}
