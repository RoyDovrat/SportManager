package com.sportmanager.service;

import com.sportmanager.dto.request.ClothingOrderRequest;
import com.sportmanager.dto.request.ClothingOrderUpdateRequest;
import com.sportmanager.dto.response.ClothingOrderResponse;
import com.sportmanager.dto.response.PaymentResponse;
import com.sportmanager.entity.Activity;
import com.sportmanager.entity.ClothingOrder;
import com.sportmanager.entity.ClothingPricing;
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
import com.sportmanager.repository.ClothingPricingRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import com.sportmanager.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final ClothingPricingRepository clothingPricingRepository;
    private final PaymentService paymentService;

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
            validateSkipAllowed(season);
            validateAlreadyHasOrder(
                    request.getShortKitQuantity(),
                    request.getShortKitSize(),
                    request.getLongKitQuantity(),
                    request.getLongKitSize(),
                    request.getHoodieQuantity(),
                    request.getHoodieSize(),
                    request.getSocksQuantity(),
                    request.getSocksSize(),
                    request.getShirtNumber()
            );
        } else {
            validateOrderDetails(
                    request.getShortKitQuantity(),
                    request.getShortKitSize(),
                    request.getLongKitQuantity(),
                    request.getLongKitSize(),
                    request.getHoodieQuantity(),
                    request.getHoodieSize(),
                    request.getSocksQuantity(),
                    request.getSocksSize(),
                    request.getShirtNumber()
            );
        }
        if (!alreadyHasClothing && !isAuthenticatedAdmin()) {
            validatePublicItemAvailability(
                    season,
                    request.getLongKitQuantity(),
                    request.getHoodieQuantity(),
                    request.getSocksQuantity()
            );
        } else if (alreadyHasClothing && !isAuthenticatedAdmin()) {
            validatePublicItemAvailability(
                    season,
                    0,
                    request.getHoodieQuantity(),
                    0
            );
        }

        ClothingOrder saved = clothingOrderRepository.save(
                buildClothingOrder(request, registration, alreadyHasClothing)
        );
        return finishOrder(saved);
    }

    @Transactional
    public ClothingOrderResponse updateClothingOrder(
            Long orderId,
            ClothingOrderUpdateRequest request
    ) {
        ClothingOrder order = getOrderEntity(orderId);
        Season season = order.getRegistration().getSeason();

        boolean alreadyHasClothing = Boolean.TRUE.equals(request.getAlreadyHasClothing());
        if (alreadyHasClothing) {
            validateSkipAllowed(season);
            validateAlreadyHasOrder(
                    request.getShortKitQuantity(),
                    request.getShortKitSize(),
                    request.getLongKitQuantity(),
                    request.getLongKitSize(),
                    request.getHoodieQuantity(),
                    request.getHoodieSize(),
                    request.getSocksQuantity(),
                    request.getSocksSize(),
                    request.getShirtNumber()
            );
        } else {
            validateOrderDetails(
                    request.getShortKitQuantity(),
                    request.getShortKitSize(),
                    request.getLongKitQuantity(),
                    request.getLongKitSize(),
                    request.getHoodieQuantity(),
                    request.getHoodieSize(),
                    request.getSocksQuantity(),
                    request.getSocksSize(),
                    request.getShirtNumber()
            );
        }
        applyOrderItems(order, request.getShortKitQuantity(), request.getShortKitSize(),
                request.getLongKitQuantity(), request.getLongKitSize(),
                request.getHoodieQuantity(), request.getHoodieSize(),
                request.getSocksQuantity(), request.getSocksSize(),
                request.getShirtNumber(), alreadyHasClothing);

        return finishOrder(clothingOrderRepository.save(order));
    }

    @Transactional
    public ClothingOrderResponse getClothingOrderById(Long orderId) {
        return finishOrder(getOrderEntity(orderId));
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

    private void validateSkipAllowed(Season season) {
        ClothingPricing pricing = clothingPricingRepository.findBySeasonId(season.getId())
                .orElse(null);
        boolean allowSkip = pricing == null
                || pricing.getAllowAlreadyHasClothingSkip() == null
                || Boolean.TRUE.equals(pricing.getAllowAlreadyHasClothingSkip());
        if (!allowSkip) {
            throw new BusinessRuleException(
                    "Skipping clothing order is not allowed for this season"
            );
        }
    }

    private void validatePublicItemAvailability(
            Season season,
            Integer longKitQuantity,
            Integer hoodieQuantity,
            Integer socksQuantity
    ) {
        ClothingPricing pricing = clothingPricingRepository.findBySeasonId(season.getId())
                .orElse(null);
        boolean longKitEnabled = pricing == null
                || pricing.getLongKitPublicEnabled() == null
                || Boolean.TRUE.equals(pricing.getLongKitPublicEnabled());
        boolean hoodieEnabled = pricing == null
                || pricing.getHoodiePublicEnabled() == null
                || Boolean.TRUE.equals(pricing.getHoodiePublicEnabled());
        boolean socksEnabled = pricing != null
                && Boolean.TRUE.equals(pricing.getSocksPublicEnabled());

        if (!longKitEnabled && safeQuantity(longKitQuantity) > 0) {
            throw new BusinessRuleException(
                    "Long kit is not available for public order in this season"
            );
        }
        if (!hoodieEnabled && safeQuantity(hoodieQuantity) > 0) {
            throw new BusinessRuleException(
                    "Hoodie is not available for public order in this season"
            );
        }
        if (!socksEnabled && safeQuantity(socksQuantity) > 0) {
            throw new BusinessRuleException(
                    "Socks are not available for public order in this season"
            );
        }
    }

    /**
     * "Already has gear" covers only the long kit and socks.
     * The short kit stays mandatory. Hoodie stays an optional extra.
     * Existing full-skip rows are left untouched until an admin saves them.
     */
    private void validateAlreadyHasOrder(
            Integer shortKitQuantity,
            ClothingSize shortKitSize,
            Integer longKitQuantity,
            ClothingSize longKitSize,
            Integer hoodieQuantity,
            ClothingSize hoodieSize,
            Integer socksQuantity,
            ClothingSize socksSize,
            Integer shirtNumber
    ) {
        if (safeQuantity(longKitQuantity) > 0
                || longKitSize != null
                || safeQuantity(socksQuantity) > 0
                || socksSize != null) {
            throw new BusinessRuleException(
                    "Long kit and socks are not ordered when that gear is already owned"
            );
        }

        int shortQty = requireNonNullQuantity(shortKitQuantity, "Short kit");
        int hoodieQty = requireNonNullQuantity(hoodieQuantity, "Hoodie");
        if (shortQty < 1) {
            throw new BusinessRuleException("Short kit must be ordered");
        }
        validateQuantityAndSize(shortQty, shortKitSize, "Short kit");
        validateQuantityAndSize(hoodieQty, hoodieSize, "Hoodie");
        validateShirtNumber(shirtNumber);
    }

    private void validateOrderDetails(
            Integer shortKitQuantity,
            ClothingSize shortKitSize,
            Integer longKitQuantity,
            ClothingSize longKitSize,
            Integer hoodieQuantity,
            ClothingSize hoodieSize,
            Integer socksQuantity,
            ClothingSize socksSize,
            Integer shirtNumber
    ) {
        int shortQty = requireNonNullQuantity(shortKitQuantity, "Short kit");
        int longQty = requireNonNullQuantity(longKitQuantity, "Long kit");
        int hoodieQty = requireNonNullQuantity(hoodieQuantity, "Hoodie");
        int socksQty = optionalQuantity(socksQuantity);

        validateQuantityAndSize(shortQty, shortKitSize, "Short kit");
        validateQuantityAndSize(longQty, longKitSize, "Long kit");
        validateQuantityAndSize(hoodieQty, hoodieSize, "Hoodie");
        validateQuantityAndSize(socksQty, socksSize, "Socks");

        if (shortQty + longQty + hoodieQty + socksQty == 0) {
            throw new BusinessRuleException("At least one clothing item must be ordered");
        }

        validateShirtNumber(shirtNumber);
    }

    private int optionalQuantity(Integer quantity) {
        return quantity == null ? 0 : quantity;
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
        if (shirtNumber == null) {
            throw new BusinessRuleException("Printed clothing number is required");
        }
        if (shirtNumber < 0 || shirtNumber > 99) {
            throw new BusinessRuleException("Printed clothing number must be between 0 and 99");
        }
    }

    private ClothingOrder buildClothingOrder(
            ClothingOrderRequest request,
            Registration registration,
            boolean alreadyHasClothing
    ) {
        ClothingOrder clothingOrder = new ClothingOrder();
        clothingOrder.setRegistration(registration);
        applyOrderItems(
                clothingOrder,
                request.getShortKitQuantity(),
                request.getShortKitSize(),
                request.getLongKitQuantity(),
                request.getLongKitSize(),
                request.getHoodieQuantity(),
                request.getHoodieSize(),
                request.getSocksQuantity(),
                request.getSocksSize(),
                request.getShirtNumber(),
                alreadyHasClothing
        );

        return clothingOrder;
    }

    private void applyOrderItems(
            ClothingOrder clothingOrder,
            Integer shortKitQuantity,
            ClothingSize shortKitSize,
            Integer longKitQuantity,
            ClothingSize longKitSize,
            Integer hoodieQuantity,
            ClothingSize hoodieSize,
            Integer socksQuantity,
            ClothingSize socksSize,
            Integer shirtNumber,
            boolean alreadyHasClothing
    ) {
        clothingOrder.setAlreadyHasClothing(alreadyHasClothing);
        clothingOrder.setShortKitQuantity(shortKitQuantity);
        clothingOrder.setShortKitSize(shortKitSize);
        clothingOrder.setHoodieQuantity(hoodieQuantity);
        clothingOrder.setHoodieSize(hoodieSize);
        clothingOrder.setShirtNumber(shirtNumber);
        if (alreadyHasClothing) {
            clothingOrder.setLongKitQuantity(0);
            clothingOrder.setLongKitSize(null);
            clothingOrder.setSocksQuantity(0);
            clothingOrder.setSocksSize(null);
        } else {
            clothingOrder.setLongKitQuantity(longKitQuantity);
            clothingOrder.setLongKitSize(longKitSize);
            clothingOrder.setSocksQuantity(optionalQuantity(socksQuantity));
            clothingOrder.setSocksSize(socksSize);
        }
    }

    private ClothingOrderResponse finishOrder(ClothingOrder order) {
        PaymentResponse payment = syncClothingPayment(order);
        Long paymentId = payment != null
                ? payment.getId()
                : (order.getPayment() != null ? order.getPayment().getId() : null);
        return toResponse(order, paymentId);
    }

    private PaymentResponse syncClothingPayment(ClothingOrder order) {
        // Older rows used this flag for a full skip with no items. Leave those charges alone.
        if (Boolean.TRUE.equals(order.getAlreadyHasClothing()) && !hasOrderedItems(order)) {
            paymentService.cancelPendingClothingPayment(order);
            return null;
        }
        return paymentService.ensureClothingPayment(order);
    }

    private boolean hasOrderedItems(ClothingOrder order) {
        return safeQuantity(order.getShortKitQuantity()) > 0
                || safeQuantity(order.getLongKitQuantity()) > 0
                || safeQuantity(order.getHoodieQuantity()) > 0
                || safeQuantity(order.getSocksQuantity()) > 0;
    }

    public ClothingOrderResponse toResponse(ClothingOrder order) {
        Long paymentId = order.getPayment() != null ? order.getPayment().getId() : null;
        return toResponse(order, paymentId);
    }

    private ClothingOrderResponse toResponse(ClothingOrder order, Long clothingPaymentId) {
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
                .socksQuantity(order.getSocksQuantity() == null ? 0 : order.getSocksQuantity())
                .socksSize(order.getSocksSize())
                .shirtNumber(order.getShirtNumber())
                .clothingPaymentRequired(!alreadyHas)
                .clothingPaymentId(clothingPaymentId)
                .build();
    }

    private boolean isAuthenticatedAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null
                && auth.isAuthenticated()
                && !(auth instanceof AnonymousAuthenticationToken);
    }

    private int safeQuantity(Integer quantity) {
        return quantity == null ? 0 : quantity;
    }
}
