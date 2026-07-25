package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class SeasonReportResponse {

    private Long seasonId;
    private String seasonName;

    private RegistrationReportSection registrations;
    private PaymentReportSection payments;
    private ClothingReportSection clothing;

    @Getter
    @Builder
    public static class RegistrationReportSection {
        private long total;
        private long pending;
        private long approved;
        private long cancelled;
        private long activeStudents;
        private List<RegistrationResponse> items;
    }

    @Getter
    @Builder
    public static class PaymentReportSection {
        private long pendingCount;
        private long paidCount;
        private long cancelledCount;
        private BigDecimal pendingAmount;
        private BigDecimal paidAmount;
        private BigDecimal cancelledAmount;
        private List<PaymentResponse> items;
    }

    @Getter
    @Builder
    public static class ClothingReportSection {
        private long totalOrders;
        private long ordersRequiringPayment;
        private long alreadyHasClothingCount;
        private List<ClothingOrderResponse> items;
    }
}
