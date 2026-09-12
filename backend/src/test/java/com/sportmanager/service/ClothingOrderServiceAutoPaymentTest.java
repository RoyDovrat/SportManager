package com.sportmanager.service;

import com.sportmanager.dto.request.ClothingOrderRequest;
import com.sportmanager.dto.request.ClothingOrderUpdateRequest;
import com.sportmanager.dto.response.PaymentResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ClothingOrder;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.ClothingSize;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.ClothingOrderRepository;
import com.sportmanager.repository.ClothingPricingRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import com.sportmanager.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClothingOrderServiceAutoPaymentTest {

    @Mock
    private ClothingOrderRepository clothingOrderRepository;
    @Mock
    private RegistrationRepository registrationRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private SeasonRepository seasonRepository;
    @Mock
    private ClothingPricingRepository clothingPricingRepository;
    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private ClothingOrderService clothingOrderService;

    private Student student;
    private Season season;
    private Activity football;
    private Registration registration;

    @BeforeEach
    void setUp() {
        student = new Student();
        student.setId(1L);
        student.setIdentityNumber("100000017");
        student.setFirstName("Omer");
        student.setLastName("Levi");

        season = new Season();
        season.setId(2L);
        season.setName("2026-2027");
        season.setActivityType(ActivityType.FOOTBALL);

        football = new Activity();
        football.setId(3L);
        football.setActivityType(ActivityType.FOOTBALL);

        registration = new Registration();
        registration.setId(4L);
        registration.setStudent(student);
        registration.setSeason(season);
        registration.setActivity(football);
        registration.setStatus(RegistrationStatus.APPROVED);

        lenient().when(clothingPricingRepository.findBySeasonId(2L)).thenReturn(Optional.empty());
    }

    @Test
    void createOrder_createsClothingPaymentAutomatically() {
        stubCreateLookups();
        when(clothingOrderRepository.save(any(ClothingOrder.class))).thenAnswer(invocation -> {
            ClothingOrder order = invocation.getArgument(0);
            order.setId(1L);
            return order;
        });
        when(paymentService.ensureClothingPayment(any(ClothingOrder.class)))
                .thenReturn(PaymentResponse.builder().id(8L).clothingOrderId(1L).build());

        clothingOrderService.createClothingOrder(realOrderRequest());

        verify(paymentService).ensureClothingPayment(any(ClothingOrder.class));
    }

    @Test
    void createSkipOrder_doesNotCreateClothingPayment() {
        stubCreateLookups();
        when(clothingOrderRepository.save(any(ClothingOrder.class))).thenAnswer(invocation -> {
            ClothingOrder order = invocation.getArgument(0);
            order.setId(1L);
            return order;
        });

        ClothingOrderRequest request = new ClothingOrderRequest();
        request.setStudentIdentityNumber("100000017");
        request.setSeasonId(2L);
        request.setAlreadyHasClothing(true);

        clothingOrderService.createClothingOrder(request);

        verify(paymentService, never()).ensureClothingPayment(any());
    }

    @Test
    void updateToAlreadyHas_cancelsPendingClothingPayment() {
        ClothingOrder order = existingOrder();
        when(clothingOrderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(clothingOrderRepository.save(order)).thenReturn(order);

        ClothingOrderUpdateRequest request = new ClothingOrderUpdateRequest();
        request.setAlreadyHasClothing(true);

        clothingOrderService.updateClothingOrder(1L, request);

        verify(paymentService).cancelPendingClothingPayment(order);
        verify(paymentService, never()).ensureClothingPayment(any());
    }

    @Test
    void updateItems_refreshesPendingClothingPayment() {
        ClothingOrder order = existingOrder();
        when(clothingOrderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(clothingOrderRepository.save(order)).thenReturn(order);
        when(paymentService.ensureClothingPayment(order))
                .thenReturn(PaymentResponse.builder().id(8L).clothingOrderId(1L).build());

        ClothingOrderUpdateRequest request = new ClothingOrderUpdateRequest();
        request.setAlreadyHasClothing(false);
        request.setShortKitQuantity(2);
        request.setShortKitSize(ClothingSize.M);
        request.setLongKitQuantity(0);
        request.setHoodieQuantity(0);
        request.setShirtNumber(10);

        clothingOrderService.updateClothingOrder(1L, request);

        verify(paymentService).ensureClothingPayment(order);
    }

    private void stubCreateLookups() {
        when(studentRepository.findByIdentityNumber("100000017")).thenReturn(Optional.of(student));
        when(seasonRepository.findById(2L)).thenReturn(Optional.of(season));
        when(activityRepository.findByActivityType(ActivityType.FOOTBALL)).thenReturn(Optional.of(football));
        when(registrationRepository.findByStudentAndActivityAndSeason(student, football, season))
                .thenReturn(Optional.of(registration));
        when(clothingOrderRepository.existsByRegistration(registration)).thenReturn(false);
    }

    private ClothingOrderRequest realOrderRequest() {
        ClothingOrderRequest request = new ClothingOrderRequest();
        request.setStudentIdentityNumber("100000017");
        request.setSeasonId(2L);
        request.setAlreadyHasClothing(false);
        request.setShortKitQuantity(1);
        request.setShortKitSize(ClothingSize.M);
        request.setLongKitQuantity(0);
        request.setHoodieQuantity(0);
        request.setShirtNumber(10);
        return request;
    }

    private ClothingOrder existingOrder() {
        ClothingOrder order = new ClothingOrder();
        order.setId(1L);
        order.setRegistration(registration);
        order.setAlreadyHasClothing(false);
        order.setShortKitQuantity(1);
        order.setShortKitSize(ClothingSize.M);
        order.setLongKitQuantity(0);
        order.setHoodieQuantity(0);
        order.setShirtNumber(10);
        return order;
    }
}
