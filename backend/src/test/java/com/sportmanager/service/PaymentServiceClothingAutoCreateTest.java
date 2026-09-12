package com.sportmanager.service;

import com.sportmanager.entity.ClothingOrder;
import com.sportmanager.entity.ClothingPricing;
import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Payment;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.PaymentType;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.repository.ClothingPricingRepository;
import com.sportmanager.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceClothingAutoCreateTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ClothingPricingRepository clothingPricingRepository;

    @InjectMocks
    private PaymentService paymentService;

    private Season season;
    private Registration registration;
    private ClothingOrder order;
    private ClothingPricing pricing;

    @BeforeEach
    void setUp() {
        Parent parent = new Parent();
        parent.setId(1L);
        parent.setFirstName("Dana");
        parent.setLastName("Levi");
        parent.setIsKibbutzMember(false);

        Student student = new Student();
        student.setId(2L);
        student.setFirstName("Omer");
        student.setLastName("Levi");
        student.setParent(parent);

        season = new Season();
        season.setId(3L);
        season.setName("2026-2027");

        registration = new Registration();
        registration.setId(4L);
        registration.setStudent(student);
        registration.setSeason(season);
        registration.setStatus(RegistrationStatus.APPROVED);

        order = new ClothingOrder();
        order.setId(5L);
        order.setRegistration(registration);
        order.setAlreadyHasClothing(false);
        order.setShortKitQuantity(1);
        order.setLongKitQuantity(0);
        order.setHoodieQuantity(0);

        pricing = new ClothingPricing();
        pricing.setSeason(season);
        pricing.setShortKitPrice(new BigDecimal("120"));
        pricing.setLongKitPrice(new BigDecimal("150"));
        pricing.setHoodiePrice(new BigDecimal("90"));
    }

    @Test
    void ensureClothingPayment_createsPendingChargeFromOrderItems() {
        when(paymentRepository.findByClothingOrder(order)).thenReturn(Optional.empty());
        when(clothingPricingRepository.findBySeason(season)).thenReturn(Optional.of(pricing));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(8L);
            return payment;
        });

        var response = paymentService.ensureClothingPayment(order);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment saved = captor.getValue();
        assertThat(saved.getPaymentType()).isEqualTo(PaymentType.CLOTHING);
        assertThat(saved.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(saved.getAmount()).isEqualByComparingTo("120");
        assertThat(saved.getClothingOrder()).isSameAs(order);
        assertThat(response.getId()).isEqualTo(8L);
        assertThat(response.getClothingOrderId()).isEqualTo(5L);
    }

    @Test
    void ensureClothingPayment_skipsWhenStudentAlreadyHasClothing() {
        order.setAlreadyHasClothing(true);

        assertThat(paymentService.ensureClothingPayment(order)).isNull();

        verify(paymentRepository, never()).save(any());
    }

    @Test
    void ensureClothingPayment_updatesPendingAmountWhenItemsChange() {
        Payment existing = new Payment();
        existing.setId(8L);
        existing.setRegistration(registration);
        existing.setClothingOrder(order);
        existing.setStatus(PaymentStatus.PENDING);
        existing.setAmount(new BigDecimal("120"));
        existing.setPaymentType(PaymentType.CLOTHING);

        order.setShortKitQuantity(2);

        when(paymentRepository.findByClothingOrder(order)).thenReturn(Optional.of(existing));
        when(clothingPricingRepository.findBySeason(season)).thenReturn(Optional.of(pricing));
        when(paymentRepository.save(existing)).thenReturn(existing);

        var response = paymentService.ensureClothingPayment(order);

        assertThat(existing.getAmount()).isEqualByComparingTo("240");
        assertThat(existing.getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(response.getId()).isEqualTo(8L);
    }

    @Test
    void ensureClothingPayment_doesNotChangePaidAmount() {
        Payment existing = new Payment();
        existing.setId(8L);
        existing.setRegistration(registration);
        existing.setClothingOrder(order);
        existing.setStatus(PaymentStatus.PAID);
        existing.setAmount(new BigDecimal("120"));
        existing.setPaymentType(PaymentType.CLOTHING);

        order.setShortKitQuantity(2);

        when(paymentRepository.findByClothingOrder(order)).thenReturn(Optional.of(existing));

        var response = paymentService.ensureClothingPayment(order);

        assertThat(existing.getAmount()).isEqualByComparingTo("120");
        verify(paymentRepository, never()).save(any());
        assertThat(response.getId()).isEqualTo(8L);
    }

    @Test
    void cancelPendingClothingPayment_cancelsOpenCharge() {
        Payment existing = new Payment();
        existing.setId(8L);
        existing.setRegistration(registration);
        existing.setClothingOrder(order);
        existing.setStatus(PaymentStatus.PENDING);
        existing.setAmount(new BigDecimal("120"));
        existing.setPaymentType(PaymentType.CLOTHING);

        when(paymentRepository.findByClothingOrder(order)).thenReturn(Optional.of(existing));
        when(paymentRepository.save(existing)).thenReturn(existing);

        paymentService.cancelPendingClothingPayment(order);

        assertThat(existing.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
        verify(paymentRepository).save(existing);
    }

    @Test
    void cancelPendingClothingPayment_leavesPaidChargeAlone() {
        Payment existing = new Payment();
        existing.setId(8L);
        existing.setRegistration(registration);
        existing.setClothingOrder(order);
        existing.setStatus(PaymentStatus.PAID);
        existing.setAmount(new BigDecimal("120"));
        existing.setPaymentType(PaymentType.CLOTHING);

        when(paymentRepository.findByClothingOrder(order)).thenReturn(Optional.of(existing));

        paymentService.cancelPendingClothingPayment(order);

        assertThat(existing.getStatus()).isEqualTo(PaymentStatus.PAID);
        verify(paymentRepository, never()).save(any());
    }
}
