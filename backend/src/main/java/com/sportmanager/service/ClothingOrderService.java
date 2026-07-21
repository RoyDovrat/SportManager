package com.sportmanager.service;

import com.sportmanager.dto.request.ClothingOrderRequest;
import com.sportmanager.dto.response.ClothingOrderResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ClothingOrder;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.ClothingSize;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ActivityRepository;
import com.sportmanager.repository.ClothingOrderRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import com.sportmanager.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClothingOrderService {

    private final ClothingOrderRepository clothingOrderRepository;
    private final RegistrationRepository registrationRepository;
    private final StudentRepository studentRepository;
    private final ActivityRepository activityRepository;
    private final SeasonRepository seasonRepository;

    @Transactional
    public ClothingOrderResponse createClothingOrder(ClothingOrderRequest request) {
        Student student = getStudent(request.getStudentIdentityNumber());
        Season season = getSeason(request.getSeasonId());
        Activity footballActivity = getFootballActivity();
        Registration registration = getFootballRegistration(student, footballActivity, season);

        validateRegistrationIsApproved(registration);
        validateOrderDoesNotExist(registration);

        boolean alreadyHasClothing = Boolean.TRUE.equals(request.getAlreadyHasClothing());
        if (alreadyHasClothing) {
            validateSkipOrderHasNoItems(request);
        } else {
            validateOrderDetails(request);
        }

        ClothingOrder saved = clothingOrderRepository.save(
                buildClothingOrder(request, registration, alreadyHasClothing)
        );
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ClothingOrderResponse getClothingOrderById(Long orderId) {
        return toResponse(getOrderEntity(orderId));
    }

    @Transactional(readOnly = true)
    public List<ClothingOrderResponse> getClothingOrders(Long seasonId, String studentIdentityNumber) {
        List<ClothingOrder> orders;

        if (seasonId != null && studentIdentityNumber != null) {
            orders = clothingOrderRepository.findByRegistration_Season_Id(seasonId).stream()
                    .filter(order -> order.getRegistration()
                            .getStudent()
                            .getIdentityNumber()
                            .equals(studentIdentityNumber))
                    .toList();
        } else if (seasonId != null) {
            orders = clothingOrderRepository.findByRegistration_Season_Id(seasonId);
        } else if (studentIdentityNumber != null) {
            orders = clothingOrderRepository
                    .findByRegistration_Student_IdentityNumber(studentIdentityNumber);
        } else {
            orders = clothingOrderRepository.findAll();
        }

        return orders.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ClothingOrder getOrderEntity(Long orderId) {
        return clothingOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Clothing order was not found with id: " + orderId
                ));
    }

    private Student getStudent(String identityNumber) {
        return studentRepository.findByIdentityNumber(identityNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student was not found with identity number: " + identityNumber
                ));
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));
    }

    private Activity getFootballActivity() {
        return activityRepository.findByActivityType(ActivityType.FOOTBALL)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Football activity was not found"
                ));
    }

    private Registration getFootballRegistration(
            Student student,
            Activity footballActivity,
            Season season
    ) {
        return registrationRepository
                .findByStudentAndActivityAndSeason(student, footballActivity, season)
                .orElseThrow(() -> new BusinessRuleException(
                        "Student is not registered for football in this season"
                ));
    }

    private void validateRegistrationIsApproved(Registration registration) {
        if (registration.getStatus() != RegistrationStatus.APPROVED) {
            throw new BusinessRuleException(
                    "Clothing can only be ordered for an approved registration"
            );
        }
    }

    private void validateOrderDoesNotExist(Registration registration) {
        if (clothingOrderRepository.existsByRegistration(registration)) {
            throw new ConflictException(
                    "A clothing order already exists for this registration"
            );
        }
    }

    private void validateSkipOrderHasNoItems(ClothingOrderRequest request) {
        if (safeQuantity(request.getShortKitQuantity()) > 0
                || safeQuantity(request.getLongKitQuantity()) > 0
                || safeQuantity(request.getHoodieQuantity()) > 0
                || request.getShortKitSize() != null
                || request.getLongKitSize() != null
                || request.getHoodieSize() != null
                || request.getShirtNumber() != null) {
            throw new BusinessRuleException(
                    "When alreadyHasClothing is true, no clothing items or shirt number may be provided"
            );
        }
    }

    private void validateOrderDetails(ClothingOrderRequest request) {
        int shortQty = requireNonNullQuantity(request.getShortKitQuantity(), "Short kit");
        int longQty = requireNonNullQuantity(request.getLongKitQuantity(), "Long kit");
        int hoodieQty = requireNonNullQuantity(request.getHoodieQuantity(), "Hoodie");

        validateQuantityAndSize(shortQty, request.getShortKitSize(), "Short kit");
        validateQuantityAndSize(longQty, request.getLongKitSize(), "Long kit");
        validateQuantityAndSize(hoodieQty, request.getHoodieSize(), "Hoodie");

        if (shortQty + longQty + hoodieQty == 0) {
            throw new BusinessRuleException("At least one clothing item must be ordered");
        }

        validateShirtNumber(request.getShirtNumber());
    }

    private int requireNonNullQuantity(Integer quantity, String itemName) {
        if (quantity == null) {
            throw new BusinessRuleException(itemName + " quantity is required");
        }
        return quantity;
    }

    private void validateQuantityAndSize(int quantity, ClothingSize size, String itemName) {
        if (quantity < 0) {
            throw new BusinessRuleException(itemName + " quantity must be zero or greater");
        }
        if (quantity > 0 && size == null) {
            throw new BusinessRuleException(
                    itemName + " size is required when quantity is greater than zero"
            );
        }
        if (quantity == 0 && size != null) {
            throw new BusinessRuleException(
                    itemName + " size must not be selected when quantity is zero"
            );
        }
    }

    private void validateShirtNumber(Integer shirtNumber) {
        if (shirtNumber != null && (shirtNumber < 0 || shirtNumber > 99)) {
            throw new BusinessRuleException("Shirt number must be between 0 and 99");
        }
    }

    private ClothingOrder buildClothingOrder(
            ClothingOrderRequest request,
            Registration registration,
            boolean alreadyHasClothing
    ) {
        ClothingOrder clothingOrder = new ClothingOrder();
        clothingOrder.setRegistration(registration);
        clothingOrder.setAlreadyHasClothing(alreadyHasClothing);

        if (alreadyHasClothing) {
            clothingOrder.setShortKitQuantity(0);
            clothingOrder.setLongKitQuantity(0);
            clothingOrder.setHoodieQuantity(0);
            clothingOrder.setShortKitSize(null);
            clothingOrder.setLongKitSize(null);
            clothingOrder.setHoodieSize(null);
            clothingOrder.setShirtNumber(null);
        } else {
            clothingOrder.setShortKitQuantity(request.getShortKitQuantity());
            clothingOrder.setShortKitSize(request.getShortKitSize());
            clothingOrder.setLongKitQuantity(request.getLongKitQuantity());
            clothingOrder.setLongKitSize(request.getLongKitSize());
            clothingOrder.setHoodieQuantity(request.getHoodieQuantity());
            clothingOrder.setHoodieSize(request.getHoodieSize());
            clothingOrder.setShirtNumber(request.getShirtNumber());
        }

        return clothingOrder;
    }

    private ClothingOrderResponse toResponse(ClothingOrder order) {
        Registration registration = order.getRegistration();
        Student student = registration.getStudent();
        Season season = registration.getSeason();
        boolean alreadyHas = Boolean.TRUE.equals(order.getAlreadyHasClothing());

        return ClothingOrderResponse.builder()
                .id(order.getId())
                .registrationId(registration.getId())
                .studentId(student.getId())
                .studentIdentityNumber(student.getIdentityNumber())
                .studentFirstName(student.getFirstName())
                .studentLastName(student.getLastName())
                .seasonId(season.getId())
                .seasonName(season.getName())
                .alreadyHasClothing(alreadyHas)
                .shortKitQuantity(order.getShortKitQuantity())
                .shortKitSize(order.getShortKitSize())
                .longKitQuantity(order.getLongKitQuantity())
                .longKitSize(order.getLongKitSize())
                .hoodieQuantity(order.getHoodieQuantity())
                .hoodieSize(order.getHoodieSize())
                .shirtNumber(order.getShirtNumber())
                .clothingPaymentRequired(!alreadyHas)
                .build();
    }

    private int safeQuantity(Integer quantity) {
        return quantity == null ? 0 : quantity;
    }
}
