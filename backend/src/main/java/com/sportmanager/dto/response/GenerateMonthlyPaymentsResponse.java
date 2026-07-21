package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class GenerateMonthlyPaymentsResponse {

    private int createdCount;
    private int skippedCount;
    private List<PaymentResponse> createdPayments;
}
