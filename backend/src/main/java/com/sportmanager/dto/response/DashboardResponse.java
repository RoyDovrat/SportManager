package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class DashboardResponse {

    private Long seasonId;
    private String seasonName;

    private long totalRegistrations;
    private long pendingRegistrations;
    private long approvedRegistrations;
    private long cancelledRegistrations;
    private long activeStudents;

    private long openChargesCount;
    private BigDecimal openChargesAmount;

    private BigDecimal monthlyIncome;

    private PaymentStatusSummary paymentStatusSummary;
    private List<RegistrationResponse> recentRegistrations;
}
