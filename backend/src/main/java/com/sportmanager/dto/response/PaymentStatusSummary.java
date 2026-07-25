package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PaymentStatusSummary {

    private long pendingCount;
    private long paidCount;
    private long cancelledCount;
    private BigDecimal pendingAmount;
    private BigDecimal paidAmount;
    private BigDecimal cancelledAmount;
}
