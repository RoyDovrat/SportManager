package com.sportmanager.service;

import com.sportmanager.dto.request.ClothingPaymentRequest;
import com.sportmanager.dto.request.MonthlyPaymentRequest;
import com.sportmanager.entity.ClothingOrder;
import com.sportmanager.entity.ClothingPricing;
import com.sportmanager.entity.Payment;
import com.sportmanager.entity.Registration;
import com.sportmanager.enums.PaymentMethod;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.PaymentType;
import com.sportmanager.repository.ClothingOrderRepository;
import com.sportmanager.repository.ClothingPricingRepository;
import com.sportmanager.repository.PaymentRepository;
import com.sportmanager.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RegistrationRepository registrationRepository;
    private final ClothingOrderRepository clothingOrderRepository;
    private final ClothingPricingRepository clothingPricingRepository;

    @Transactional
    public Payment createMonthlyPayment(
            MonthlyPaymentRequest request
    ) {
        Registration registration = getRegistration(request.getRegistrationId());

        LocalDate chargeMonth = request.getChargeMonth().withDayOfMonth(1);

        validateMonthlyPaymentDoesNotExist(registration, chargeMonth);

        BigDecimal amount =registration.getActivityPricing().getMonthlyPrice();

        Payment payment = new Payment();

        payment.setRegistration(registration);
        payment.setAmount(amount);
        payment.setChargeMonth(chargeMonth);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentDate(null);
        payment.setPaymentMethod(determinePaymentMethod(registration));
        payment.setPaymentType(PaymentType.MONTHLY_ACTIVITY);
        payment.setClothingOrder(null);

        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment createClothingPayment(ClothingPaymentRequest request) {
        ClothingOrder clothingOrder = getClothingOrder(request.getClothingOrderId());

        validateClothingPaymentDoesNotExist(clothingOrder);

        Registration registration = clothingOrder.getRegistration();

        ClothingPricing clothingPricing = getClothingPricing(registration);

        BigDecimal amount = calculateClothingAmount(clothingOrder, clothingPricing);

        Payment payment = new Payment();

        payment.setRegistration(registration);
        payment.setAmount(amount);
        payment.setChargeMonth(null);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentDate(null);
        payment.setPaymentMethod(determinePaymentMethod(registration));
        payment.setPaymentType(PaymentType.CLOTHING);
        payment.setClothingOrder(clothingOrder);

        return paymentRepository.save(payment);
    }

    private Registration getRegistration(Long registrationId) {
        return registrationRepository
                .findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));
    }

    private ClothingOrder getClothingOrder(Long clothingOrderId) {
        return clothingOrderRepository
                .findById(clothingOrderId)
                .orElseThrow(() -> new RuntimeException("Clothing order not found")
                );
    }

    private ClothingPricing getClothingPricing(Registration registration) {
        return clothingPricingRepository
                .findBySeason(registration.getSeason())
                .orElseThrow(() -> new RuntimeException("Clothing pricing was not found for this season")
                );
    }

    private void validateMonthlyPaymentDoesNotExist(Registration registration, LocalDate chargeMonth) {
        boolean paymentExists =
                paymentRepository
                        .existsByRegistrationAndChargeMonthAndPaymentType(
                                registration,
                                chargeMonth,
                                PaymentType.MONTHLY_ACTIVITY
                        );

        if (paymentExists) {
            throw new RuntimeException("Monthly payment already exists for this registration and month");
        }
    }

    private void validateClothingPaymentDoesNotExist(ClothingOrder clothingOrder) {
        boolean paymentExists = paymentRepository.existsByClothingOrder(clothingOrder);

        if (paymentExists) {
            throw new RuntimeException("Payment already exists for this clothing order");
        }
    }

    private PaymentMethod determinePaymentMethod(Registration registration) {
        Boolean isKibbutzMember =
                registration
                        .getStudent()
                        .getParent()
                        .getIsKibbutzMember();

        if (Boolean.TRUE.equals(isKibbutzMember)) {
            return PaymentMethod.KIBBUTZ_BUDGET;
        }

        return PaymentMethod.BIT;
    }

    private BigDecimal calculateClothingAmount(ClothingOrder clothingOrder, ClothingPricing clothingPricing) {
        BigDecimal shortKitTotal =
                clothingPricing
                        .getShortKitPrice()
                        .multiply(
                                BigDecimal.valueOf(
                                        clothingOrder
                                                .getShortKitQuantity()
                                )
                        );

        BigDecimal longKitTotal =
                clothingPricing
                        .getLongKitPrice()
                        .multiply(
                                BigDecimal.valueOf(
                                        clothingOrder
                                                .getLongKitQuantity()
                                )
                        );

        BigDecimal hoodieTotal =
                clothingPricing
                        .getHoodiePrice()
                        .multiply(
                                BigDecimal.valueOf(
                                        clothingOrder
                                                .getHoodieQuantity()
                                )
                        );

        return shortKitTotal
                .add(longKitTotal)
                .add(hoodieTotal);
    }
}