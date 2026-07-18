package com.sportmanager.repository;

import com.sportmanager.entity.Payment;
import com.sportmanager.entity.Registration;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.PaymentType;
import com.sportmanager.entity.ClothingOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByRegistration(Registration registration);

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByChargeMonth(LocalDate chargeMonth);

    List<Payment> findByPaymentTypeAndChargeMonth(PaymentType paymentType, LocalDate chargeMonth);

    boolean existsByRegistrationAndChargeMonthAndPaymentType(Registration registration, LocalDate chargeMonth, PaymentType paymentType);

    boolean existsByClothingOrder(ClothingOrder clothingOrder);

    List<Payment> findByStatusAndChargeMonth(PaymentStatus status, LocalDate chargeMonth);
}