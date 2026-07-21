package com.sportmanager.dto.request;

import com.sportmanager.enums.PaymentMethod;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ConfirmPaymentRequest {

    /**
     * required for non-kibbutz members (BIT or PAYBOX).
     * ignored for kibbutz members (always KIBBUTZ_BUDGET).
     */
    private PaymentMethod paymentMethod;
}
