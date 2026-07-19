package com.sportmanager.service;

import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.BusinessRuleException;

import com.sportmanager.dto.request.ClothingOrderRequest;
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
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import com.sportmanager.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClothingOrderService {

    private final ClothingOrderRepository clothingOrderRepository;
    private final RegistrationRepository registrationRepository;
    private final StudentRepository studentRepository;
    private final ActivityRepository activityRepository;
    private final SeasonRepository seasonRepository;

    @Transactional
    public ClothingOrder createClothingOrder(
            ClothingOrderRequest request
    ) {
        Student student = getStudent(
                request.getStudentIdentityNumber()
        );

        Season season = getSeason(
                request.getSeasonId()
        );

        Activity footballActivity = getFootballActivity();

        Registration registration = getFootballRegistration(
                student,
                footballActivity,
                season
        );

        validateRegistrationIsApproved(registration);

        validateOrderDoesNotExist(registration);

        validateOrderDetails(request);

        ClothingOrder clothingOrder = buildClothingOrder(
                request,
                registration
        );

        return clothingOrderRepository.save(clothingOrder);
    }

    private Student getStudent(String identityNumber) {
        return studentRepository
                .findByIdentityNumber(identityNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student not found"
                        )
                );
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository
                .findById(seasonId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Season not found"
                        )
                );
    }

    private Activity getFootballActivity() {
        return activityRepository
                .findByActivityType(ActivityType.FOOTBALL)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Football activity not found"
                        )
                );
    }

    private Registration getFootballRegistration(
            Student student,
            Activity footballActivity,
            Season season
    ) {
        return registrationRepository
                .findByStudentAndActivityAndSeason(
                        student,
                        footballActivity,
                        season
                )
                .orElseThrow(() ->
                        new BusinessRuleException(
                                "Student is not registered for football in this season"
                        )
                );
    }

    private void validateRegistrationIsApproved(
            Registration registration
    ) {
        if (registration.getStatus()
                != RegistrationStatus.APPROVED) {

            throw new BusinessRuleException(
                    "Clothing can only be ordered for an approved registration"
            );
        }
    }

    private void validateOrderDoesNotExist(
            Registration registration
    ) {
        boolean orderExists =
                clothingOrderRepository
                        .existsByRegistration(registration);

        if (orderExists) {
            throw new ConflictException(
                    "A clothing order already exists for this registration"
            );
        }
    }

    private void validateOrderDetails(
            ClothingOrderRequest request
    ) {
        validateQuantityAndSize(
                request.getShortKitQuantity(),
                request.getShortKitSize(),
                "Short kit"
        );

        validateQuantityAndSize(
                request.getLongKitQuantity(),
                request.getLongKitSize(),
                "Long kit"
        );

        validateQuantityAndSize(
                request.getHoodieQuantity(),
                request.getHoodieSize(),
                "Hoodie"
        );

        int totalQuantity =
                request.getShortKitQuantity()
                        + request.getLongKitQuantity()
                        + request.getHoodieQuantity();

        if (totalQuantity == 0) {
            throw new BusinessRuleException(
                    "At least one clothing item must be ordered"
            );
        }

        validateShirtNumber(request.getShirtNumber());
    }

    private void validateQuantityAndSize(
            Integer quantity,
            ClothingSize size,
            String itemName
    ) {
        if (quantity == null || quantity < 0) {
            throw new BusinessRuleException(
                    itemName
                            + " quantity must be zero or greater"
            );
        }

        if (quantity > 0 && size == null) {
            throw new BusinessRuleException(
                    itemName
                            + " size is required when quantity is greater than zero"
            );
        }

        if (quantity == 0 && size != null) {
            throw new BusinessRuleException(
                    itemName
                            + " size must not be selected when quantity is zero"
            );
        }
    }

    private void validateShirtNumber(
            Integer shirtNumber
    ) {
        if (shirtNumber != null
                && (shirtNumber < 0 || shirtNumber > 99)) {

            throw new BusinessRuleException(
                    "Shirt number must be between 0 and 99"
            );
        }
    }

    private ClothingOrder buildClothingOrder(
            ClothingOrderRequest request,
            Registration registration
    ) {
        ClothingOrder clothingOrder =
                new ClothingOrder();

        clothingOrder.setRegistration(registration);

        clothingOrder.setShortKitQuantity(
                request.getShortKitQuantity()
        );

        clothingOrder.setShortKitSize(
                request.getShortKitSize()
        );

        clothingOrder.setLongKitQuantity(
                request.getLongKitQuantity()
        );

        clothingOrder.setLongKitSize(
                request.getLongKitSize()
        );

        clothingOrder.setHoodieQuantity(
                request.getHoodieQuantity()
        );

        clothingOrder.setHoodieSize(
                request.getHoodieSize()
        );

        clothingOrder.setShirtNumber(
                request.getShirtNumber()
        );

        return clothingOrder;
    }
}