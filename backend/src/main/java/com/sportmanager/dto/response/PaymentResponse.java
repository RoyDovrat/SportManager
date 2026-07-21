package com.sportmanager.dto.response;

import com.sportmanager.enums.PaymentMethod;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.PaymentType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Builder
public class PaymentResponse {

    private Long id;
    private Long registrationId;
    private Long studentId;
    private String studentFirstName;
    private String studentLastName;
    private Long parentId;
    private String parentFirstName;
    private String parentLastName;
    private Boolean isKibbutzMember;
    private BigDecimal amount;
    private LocalDate chargeMonth;
    private PaymentStatus status;
    private LocalDate paymentDate;
    private PaymentMethod paymentMethod;
    private PaymentType paymentType;
    private Long clothingOrderId;
}
