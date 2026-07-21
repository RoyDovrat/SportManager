package com.sportmanager.repository;

import com.sportmanager.entity.ClothingOrder;
import com.sportmanager.entity.Payment;
import com.sportmanager.entity.Registration;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.PaymentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByRegistration(Registration registration);

    List<Payment> findByRegistrationId(Long registrationId);

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByChargeMonth(LocalDate chargeMonth);

    List<Payment> findByPaymentType(PaymentType paymentType);

    List<Payment> findByStatusAndChargeMonth(PaymentStatus status, LocalDate chargeMonth);

    List<Payment> findByPaymentTypeAndChargeMonth(PaymentType paymentType, LocalDate chargeMonth);

    boolean existsByRegistrationAndChargeMonthAndPaymentType(
            Registration registration,
            LocalDate chargeMonth,
            PaymentType paymentType
    );

    boolean existsByRegistrationAndChargeMonthAndPaymentTypeAndStatusIn(
            Registration registration,
            LocalDate chargeMonth,
            PaymentType paymentType,
            Collection<PaymentStatus> statuses
    );

    Optional<Payment> findByRegistrationAndChargeMonthAndPaymentType(
            Registration registration,
            LocalDate chargeMonth,
            PaymentType paymentType
    );

    boolean existsByClothingOrder(ClothingOrder clothingOrder);

    Optional<Payment> findByClothingOrder(ClothingOrder clothingOrder);

    List<Payment> findByRegistration_Season_IdAndStatus(
            Long seasonId,
            PaymentStatus status
    );
}
