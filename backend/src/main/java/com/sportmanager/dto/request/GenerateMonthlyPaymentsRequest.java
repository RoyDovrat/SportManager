package com.sportmanager.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class GenerateMonthlyPaymentsRequest {

    @NotNull(message = "Charge month is required")
    private LocalDate chargeMonth;

    /** Optional. Defaults to the active season. */
    private Long seasonId;
}
