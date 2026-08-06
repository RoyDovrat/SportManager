package com.sportmanager.service;

import com.sportmanager.dto.request.ClothingPaymentRequest;
import com.sportmanager.dto.request.ConfirmPaymentRequest;
import com.sportmanager.dto.request.GenerateMonthlyPaymentsRequest;
import com.sportmanager.dto.request.ManualPaymentRequest;
import com.sportmanager.dto.request.MonthlyPaymentRequest;
import com.sportmanager.dto.request.PaymentUpdateRequest;
import com.sportmanager.dto.response.GenerateMonthlyPaymentsResponse;
import com.sportmanager.dto.response.PaymentResponse;
import com.sportmanager.entity.ActivityGroup;
import com.sportmanager.entity.ClothingOrder;
import com.sportmanager.entity.GroupTrainingSession;
import com.sportmanager.entity.ClothingPricing;
import com.sportmanager.entity.Parent;
import com.sportmanager.entity.Payment;
import com.sportmanager.entity.Registration;
import com.sportmanager.entity.Season;
import com.sportmanager.entity.Student;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.enums.PaymentMethod;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.PaymentType;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.exception.BusinessRuleException;
import com.sportmanager.exception.ConflictException;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ClothingOrderRepository;
import com.sportmanager.repository.ClothingPricingRepository;
import com.sportmanager.repository.PaymentRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final RegistrationRepository registrationRepository;
    private final ClothingOrderRepository clothingOrderRepository;
    private final ClothingPricingRepository clothingPricingRepository;
    private final SeasonRepository seasonRepository;

    @Transactional
    public PaymentResponse createMonthlyPayment(MonthlyPaymentRequest request) {
        Registration registration = getApprovedRegistration(request.getRegistrationId());
        LocalDate chargeMonth = request.getChargeMonth().withDayOfMonth(1);

        if (hasActiveMonthlyPayment(registration, chargeMonth)) {
            throw new ConflictException(
                    "Monthly payment already exists for this registration and month"
            );
        }
        if (!canCreateMonthlyPayment(registration)) {
            throw new BusinessRuleException(
                    "Swimming monthly payment requires an assigned group with training days and hours"
            );
        }

        Payment payment = findCancelledMonthlyPayment(registration, chargeMonth)
                .orElseGet(Payment::new);

        BigDecimal amount = resolveMonthlyAmount(registration, chargeMonth);
        populateMonthlyPayment(payment, registration, chargeMonth, amount);

        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse createClothingPayment(ClothingPaymentRequest request) {
        ClothingOrder clothingOrder = getClothingOrder(request.getClothingOrderId());
        Registration registration = clothingOrder.getRegistration();
        validateRegistrationApproved(registration);

        if (Boolean.TRUE.equals(clothingOrder.getAlreadyHasClothing())) {
            throw new BusinessRuleException(
                    "Clothing payment is not required when the student already has clothing"
            );
        }

        if (hasActiveClothingPayment(clothingOrder)) {
            throw new ConflictException("Payment already exists for this clothing order");
        }

        ClothingPricing clothingPricing = getClothingPricing(registration);
        BigDecimal amount = calculateClothingAmount(clothingOrder, clothingPricing);

        Payment payment = paymentRepository.findByClothingOrder(clothingOrder)
                .filter(existing -> existing.getStatus() == PaymentStatus.CANCELLED)
                .orElseGet(Payment::new);

        payment.setRegistration(registration);
        payment.setAmount(amount);
        payment.setChargeMonth(LocalDate.now().withDayOfMonth(1));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentDate(null);
        payment.setPaymentMethod(determineDefaultPaymentMethod(registration));
        payment.setPaymentType(PaymentType.CLOTHING);
        payment.setClothingOrder(clothingOrder);

        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse createManualPayment(ManualPaymentRequest request) {
        Registration registration = getApprovedRegistration(request.getRegistrationId());

        Payment payment = new Payment();
        payment.setRegistration(registration);
        payment.setAmount(request.getAmount());
        payment.setChargeMonth(LocalDate.now().withDayOfMonth(1));
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentDate(null);
        payment.setPaymentMethod(determineDefaultPaymentMethod(registration));
        payment.setPaymentType(PaymentType.MANUAL_ONE_TIME);
        payment.setClothingOrder(null);

        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public GenerateMonthlyPaymentsResponse generateMonthlyPayments(
            GenerateMonthlyPaymentsRequest request
    ) {
        LocalDate chargeMonth = request.getChargeMonth().withDayOfMonth(1);
        Season season = resolveSeason(request.getSeasonId());

        List<Registration> approvedRegistrations =
                registrationRepository.findBySeasonIdAndStatus(
                        season.getId(),
                        RegistrationStatus.APPROVED
                );

        List<PaymentResponse> created = new ArrayList<>();
        int skipped = 0;

        for (Registration registration : approvedRegistrations) {
            if (!canCreateMonthlyPayment(registration)) {
                skipped++;
                continue;
            }
            if (hasActiveMonthlyPayment(registration, chargeMonth)) {
                skipped++;
                continue;
            }

            Payment payment = findCancelledMonthlyPayment(registration, chargeMonth)
                    .orElseGet(Payment::new);

            BigDecimal amount = resolveMonthlyAmount(registration, chargeMonth);
            populateMonthlyPayment(payment, registration, chargeMonth, amount);
            created.add(toResponse(paymentRepository.save(payment)));
        }

        return GenerateMonthlyPaymentsResponse.builder()
                .createdCount(created.size())
                .skippedCount(skipped)
                .createdPayments(created)
                .build();
    }

    /**
     * Creates PENDING monthly payments for the current calendar month only.
     * When seasonId is null, syncs every currently active season.
     */
    @Transactional
    public GenerateMonthlyPaymentsResponse syncSeasonMonthlyPayments(Long seasonId) {
        LocalDate chargeMonth = LocalDate.now().withDayOfMonth(1);

        if (seasonId != null) {
            Season season = resolveSeason(seasonId);
            return generateMonthlyPaymentsForSeasonMonth(season, chargeMonth);
        }

        List<Season> activeSeasons = seasonRepository.findByIsActive(true);
        if (activeSeasons.isEmpty()) {
            throw new ResourceNotFoundException("No active season was found");
        }

        List<PaymentResponse> created = new ArrayList<>();
        int skipped = 0;
        for (Season season : activeSeasons) {
            GenerateMonthlyPaymentsResponse partial =
                    generateMonthlyPaymentsForSeasonMonth(season, chargeMonth);
            created.addAll(partial.getCreatedPayments());
            skipped += partial.getSkippedCount();
        }

        return GenerateMonthlyPaymentsResponse.builder()
                .createdCount(created.size())
                .skippedCount(skipped)
                .createdPayments(created)
                .build();
    }

    /**
     * Scheduler entry: for every season that covers the current month, create
     * current-month payments for all approved registrations.
     */
    @Transactional
    public GenerateMonthlyPaymentsResponse generateCurrentMonthPaymentsForCoveringSeasons() {
        LocalDate chargeMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate monthEnd = YearMonth.from(chargeMonth).atEndOfMonth();

        List<Season> seasons = seasonRepository.findAll().stream()
                .filter(season -> season.getStartDate() != null && season.getEndDate() != null)
                .filter(season -> !season.getStartDate().isAfter(monthEnd)
                        && !season.getEndDate().isBefore(chargeMonth))
                .toList();

        List<PaymentResponse> created = new ArrayList<>();
        int skipped = 0;

        for (Season season : seasons) {
            GenerateMonthlyPaymentsResponse partial =
                    generateMonthlyPaymentsForSeasonMonth(season, chargeMonth);
            created.addAll(partial.getCreatedPayments());
            skipped += partial.getSkippedCount();
        }

        return GenerateMonthlyPaymentsResponse.builder()
                .createdCount(created.size())
                .skippedCount(skipped)
                .createdPayments(created)
                .build();
    }

    /**
     * On registration approval: create a payment for the current month only,
     * if that month falls inside the registration's season.
     */
    @Transactional
    public int ensureSeasonMonthlyPayments(Registration registration) {
        validateRegistrationApproved(registration);

        LocalDate chargeMonth = LocalDate.now().withDayOfMonth(1);
        if (!seasonCoversMonth(registration.getSeason(), chargeMonth)) {
            return 0;
        }
        if (!canCreateMonthlyPayment(registration)) {
            return 0;
        }
        if (hasActiveMonthlyPayment(registration, chargeMonth)) {
            return 0;
        }

        Payment payment = findCancelledMonthlyPayment(registration, chargeMonth)
                .orElseGet(Payment::new);

        BigDecimal amount = resolveMonthlyAmount(registration, chargeMonth);
        populateMonthlyPayment(payment, registration, chargeMonth, amount);
        paymentRepository.save(payment);
        return 1;
    }

    /**
     * After swimming group assignment or schedule change: create current-month
     * PENDING payment if missing, or refresh amount on an existing PENDING row.
     * Never changes PAID amounts.
     */
    @Transactional
    public int ensureOrUpdatePendingMonthlyPayment(Registration registration) {
        validateRegistrationApproved(registration);

        LocalDate chargeMonth = LocalDate.now().withDayOfMonth(1);
        if (!seasonCoversMonth(registration.getSeason(), chargeMonth)) {
            return 0;
        }
        if (!canCreateMonthlyPayment(registration)) {
            return 0;
        }

        BigDecimal amount = resolveMonthlyAmount(registration, chargeMonth);

        java.util.Optional<Payment> existing = paymentRepository
                .findByRegistrationAndChargeMonthAndPaymentType(
                        registration,
                        chargeMonth,
                        PaymentType.MONTHLY_ACTIVITY
                );

        if (existing.isPresent()) {
            Payment payment = existing.get();
            if (payment.getStatus() == PaymentStatus.PAID) {
                return 0;
            }
            if (payment.getStatus() == PaymentStatus.PENDING) {
                payment.setAmount(amount);
                paymentRepository.save(payment);
                return 1;
            }
            // CANCELLED — reuse
            populateMonthlyPayment(payment, registration, chargeMonth, amount);
            paymentRepository.save(payment);
            return 1;
        }

        Payment payment = new Payment();
        populateMonthlyPayment(payment, registration, chargeMonth, amount);
        paymentRepository.save(payment);
        return 1;
    }

    @Transactional
    public void recalculatePendingMonthlyPaymentsForGroup(ActivityGroup group) {
        if (group == null || group.getId() == null) {
            return;
        }
        List<Registration> members = registrationRepository.findByActivityGroupId(group.getId());
        for (Registration registration : members) {
            if (registration.getStatus() == RegistrationStatus.APPROVED) {
                ensureOrUpdatePendingMonthlyPayment(registration);
            }
        }
    }

    private GenerateMonthlyPaymentsResponse generateMonthlyPaymentsForSeasonMonth(
            Season season,
            LocalDate chargeMonth
    ) {
        if (!seasonCoversMonth(season, chargeMonth)) {
            return GenerateMonthlyPaymentsResponse.builder()
                    .createdCount(0)
                    .skippedCount(0)
                    .createdPayments(List.of())
                    .build();
        }

        List<Registration> approvedRegistrations =
                registrationRepository.findBySeasonIdAndStatus(
                        season.getId(),
                        RegistrationStatus.APPROVED
                );

        List<PaymentResponse> created = new ArrayList<>();
        int skipped = 0;

        for (Registration registration : approvedRegistrations) {
            if (!canCreateMonthlyPayment(registration)) {
                skipped++;
                continue;
            }
            if (hasActiveMonthlyPayment(registration, chargeMonth)) {
                skipped++;
                continue;
            }

            Payment payment = findCancelledMonthlyPayment(registration, chargeMonth)
                    .orElseGet(Payment::new);

            BigDecimal amount = resolveMonthlyAmount(registration, chargeMonth);
            populateMonthlyPayment(payment, registration, chargeMonth, amount);
            created.add(toResponse(paymentRepository.save(payment)));
        }

        return GenerateMonthlyPaymentsResponse.builder()
                .createdCount(created.size())
                .skippedCount(skipped)
                .createdPayments(created)
                .build();
    }

    private boolean seasonCoversMonth(Season season, LocalDate chargeMonth) {
        if (season.getStartDate() == null || season.getEndDate() == null) {
            return false;
        }
        LocalDate monthEnd = YearMonth.from(chargeMonth).atEndOfMonth();
        return !season.getStartDate().isAfter(monthEnd)
                && !season.getEndDate().isBefore(chargeMonth);
    }

    /**
     * Cancels PENDING monthly activity payments for a registration (e.g. on registration cancel).
     */
    @Transactional
    public int cancelPendingMonthlyPayments(Registration registration) {
        List<Payment> payments = paymentRepository.findByRegistrationId(registration.getId());
        int cancelled = 0;
        for (Payment payment : payments) {
            if (payment.getPaymentType() != PaymentType.MONTHLY_ACTIVITY) {
                continue;
            }
            if (payment.getStatus() != PaymentStatus.PENDING) {
                continue;
            }
            payment.setStatus(PaymentStatus.CANCELLED);
            payment.setPaymentDate(null);
            paymentRepository.save(payment);
            cancelled++;
        }
        return cancelled;
    }

    @Transactional
    public PaymentResponse updatePayment(Long paymentId, PaymentUpdateRequest request) {
        Payment payment = getPaymentEntity(paymentId);

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new BusinessRuleException("Only pending payments can be edited");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Amount must be greater than zero");
        }

        payment.setAmount(request.getAmount());
        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse confirmPayment(Long paymentId, ConfirmPaymentRequest request) {
        Payment payment = getPaymentEntity(paymentId);

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new ConflictException("Payment is already paid");
        }
        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            throw new BusinessRuleException("Cancelled payments cannot be confirmed");
        }

        boolean kibbutzMember = isKibbutzMember(payment.getRegistration());
        if (kibbutzMember) {
            payment.setPaymentMethod(PaymentMethod.KIBBUTZ_BUDGET);
        } else {
            PaymentMethod method = request != null ? request.getPaymentMethod() : null;
            if (method == null) {
                throw new BusinessRuleException(
                        "Payment method (BIT or PAYBOX) is required for non-kibbutz members"
                );
            }
            if (method != PaymentMethod.BIT && method != PaymentMethod.PAYBOX) {
                throw new BusinessRuleException(
                        "Non-kibbutz payments must use BIT or PAYBOX"
                );
            }
            payment.setPaymentMethod(method);
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaymentDate(LocalDate.now());

        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse cancelPayment(Long paymentId) {
        Payment payment = getPaymentEntity(paymentId);

        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            throw new ConflictException("Payment is already cancelled");
        }
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new BusinessRuleException("Paid payments cannot be cancelled");
        }

        payment.setStatus(PaymentStatus.CANCELLED);
        payment.setPaymentDate(null);

        return toResponse(paymentRepository.save(payment));
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long paymentId) {
        return toResponse(getPaymentEntity(paymentId));
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPayments(
            Long registrationId,
            PaymentStatus status,
            PaymentType paymentType,
            LocalDate chargeMonth
    ) {
        List<Payment> payments = paymentRepository.findAll();

        return payments.stream()
                .filter(payment -> registrationId == null
                        || payment.getRegistration().getId().equals(registrationId))
                .filter(payment -> status == null || payment.getStatus() == status)
                .filter(payment -> paymentType == null || payment.getPaymentType() == paymentType)
                .filter(payment -> chargeMonth == null
                        || (payment.getChargeMonth() != null
                        && payment.getChargeMonth().equals(chargeMonth.withDayOfMonth(1))))
                .map(this::toResponse)
                .toList();
    }

    /**
     * Football: the configured price for the group's session count (1 or 2) is the
     * monthly fee as-is — no week multiplication.
     * Swimming: lesson-type unit price × scheduled session occurrences in the
     * charge month (clipped to the swimming season date range).
     */
    private BigDecimal resolveMonthlyAmount(Registration registration, LocalDate chargeMonth) {
        BigDecimal configuredPrice = registration.getActivityPricing().getMonthlyPrice();

        if (registration.getActivity().getActivityType() == ActivityType.FOOTBALL) {
            return configuredPrice;
        }

        ActivityGroup group = registration.getActivityGroup();
        if (group == null) {
            throw new BusinessRuleException(
                    "Swimming monthly payment requires an assigned swimming group"
            );
        }

        List<DayOfWeek> activeDays = activeTrainingDays(group);
        if (activeDays.isEmpty()) {
            throw new BusinessRuleException(
                    "Swimming group must have active training days and hours before billing"
            );
        }

        Season season = registration.getSeason();
        int occurrences = countSessionOccurrences(
                activeDays,
                YearMonth.from(chargeMonth),
                season.getStartDate(),
                season.getEndDate()
        );
        return configuredPrice.multiply(BigDecimal.valueOf(occurrences));
    }

    private boolean canCreateMonthlyPayment(Registration registration) {
        if (registration.getActivity().getActivityType() != ActivityType.SWIMMING) {
            return true;
        }
        ActivityGroup group = registration.getActivityGroup();
        return group != null && !activeTrainingDays(group).isEmpty();
    }

    private static List<DayOfWeek> activeTrainingDays(ActivityGroup group) {
        if (group.getTrainingSessions() == null) {
            return List.of();
        }
        return group.getTrainingSessions().stream()
                .filter(session -> Boolean.TRUE.equals(session.getIsActive()))
                .map(GroupTrainingSession::getDayOfWeek)
                .filter(day -> day != null)
                .toList();
    }

    /**
     * Counts how many times the group's training weekdays occur in the month,
     * clipped to the season date range.
     */
    static int countSessionOccurrences(
            List<DayOfWeek> activeDays,
            YearMonth yearMonth,
            LocalDate seasonStart,
            LocalDate seasonEnd
    ) {
        if (activeDays == null || activeDays.isEmpty()) {
            return 0;
        }
        java.util.Set<DayOfWeek> days = java.util.EnumSet.copyOf(activeDays);
        LocalDate day = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();
        int count = 0;
        while (!day.isAfter(end)) {
            boolean inSeason = (seasonStart == null || !day.isBefore(seasonStart))
                    && (seasonEnd == null || !day.isAfter(seasonEnd));
            if (inSeason && days.contains(day.getDayOfWeek())) {
                count++;
            }
            day = day.plusDays(1);
        }
        return count;
    }

    static List<LocalDate> monthsInSeason(Season season) {
        if (season.getStartDate() == null || season.getEndDate() == null) {
            throw new BusinessRuleException("Season start and end dates are required");
        }
        if (season.getEndDate().isBefore(season.getStartDate())) {
            throw new BusinessRuleException("Season end date must not be before start date");
        }

        List<LocalDate> months = new ArrayList<>();
        YearMonth cursor = YearMonth.from(season.getStartDate());
        YearMonth last = YearMonth.from(season.getEndDate());
        while (!cursor.isAfter(last)) {
            months.add(cursor.atDay(1));
            cursor = cursor.plusMonths(1);
        }
        return months;
    }

    private void populateMonthlyPayment(
            Payment payment,
            Registration registration,
            LocalDate chargeMonth,
            BigDecimal amount
    ) {
        payment.setRegistration(registration);
        payment.setAmount(amount);
        payment.setChargeMonth(chargeMonth);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setPaymentDate(null);
        payment.setPaymentMethod(determineDefaultPaymentMethod(registration));
        payment.setPaymentType(PaymentType.MONTHLY_ACTIVITY);
        payment.setClothingOrder(null);
    }

    private boolean hasActiveMonthlyPayment(Registration registration, LocalDate chargeMonth) {
        return paymentRepository.existsByRegistrationAndChargeMonthAndPaymentTypeAndStatusIn(
                registration,
                chargeMonth,
                PaymentType.MONTHLY_ACTIVITY,
                EnumSet.of(PaymentStatus.PENDING, PaymentStatus.PAID)
        );
    }

    private java.util.Optional<Payment> findCancelledMonthlyPayment(
            Registration registration,
            LocalDate chargeMonth
    ) {
        return paymentRepository
                .findByRegistrationAndChargeMonthAndPaymentType(
                        registration,
                        chargeMonth,
                        PaymentType.MONTHLY_ACTIVITY
                )
                .filter(payment -> payment.getStatus() == PaymentStatus.CANCELLED);
    }

    private boolean hasActiveClothingPayment(ClothingOrder clothingOrder) {
        return paymentRepository.findByClothingOrder(clothingOrder)
                .map(payment -> payment.getStatus() == PaymentStatus.PENDING
                        || payment.getStatus() == PaymentStatus.PAID)
                .orElse(false);
    }

    private Registration getApprovedRegistration(Long registrationId) {
        Registration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Registration was not found with id: " + registrationId
                ));
        validateRegistrationApproved(registration);
        return registration;
    }

    private void validateRegistrationApproved(Registration registration) {
        if (registration.getStatus() != RegistrationStatus.APPROVED) {
            throw new BusinessRuleException(
                    "Payments can only be created for an approved registration"
            );
        }
    }

    private ClothingOrder getClothingOrder(Long clothingOrderId) {
        return clothingOrderRepository.findById(clothingOrderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Clothing order was not found with id: " + clothingOrderId
                ));
    }

    private ClothingPricing getClothingPricing(Registration registration) {
        return clothingPricingRepository.findBySeason(registration.getSeason())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Clothing pricing was not found for this season"
                ));
    }

    private Season resolveSeason(Long seasonId) {
        if (seasonId != null) {
            return seasonRepository.findById(seasonId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Season was not found with id: " + seasonId
                    ));
        }

        throw new BusinessRuleException(
                "seasonId is required when multiple seasons can be active"
        );
    }

    private Payment getPaymentEntity(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Payment was not found with id: " + paymentId
                ));
    }

    private PaymentMethod determineDefaultPaymentMethod(Registration registration) {
        return isKibbutzMember(registration)
                ? PaymentMethod.KIBBUTZ_BUDGET
                : PaymentMethod.BIT;
    }

    private boolean isKibbutzMember(Registration registration) {
        return Boolean.TRUE.equals(
                registration.getStudent().getParent().getIsKibbutzMember()
        );
    }

    private BigDecimal calculateClothingAmount(
            ClothingOrder clothingOrder,
            ClothingPricing clothingPricing
    ) {
        BigDecimal shortKitTotal = clothingPricing.getShortKitPrice()
                .multiply(BigDecimal.valueOf(safeQuantity(clothingOrder.getShortKitQuantity())));
        BigDecimal longKitTotal = clothingPricing.getLongKitPrice()
                .multiply(BigDecimal.valueOf(safeQuantity(clothingOrder.getLongKitQuantity())));
        BigDecimal hoodieTotal = clothingPricing.getHoodiePrice()
                .multiply(BigDecimal.valueOf(safeQuantity(clothingOrder.getHoodieQuantity())));

        return shortKitTotal.add(longKitTotal).add(hoodieTotal);
    }

    private int safeQuantity(Integer quantity) {
        return quantity == null ? 0 : quantity;
    }

    public PaymentResponse toResponse(Payment payment) {
        Registration registration = payment.getRegistration();
        Student student = registration.getStudent();
        Parent parent = student.getParent();

        return PaymentResponse.builder()
                .id(payment.getId())
                .registrationId(registration.getId())
                .studentId(student.getId())
                .studentFirstName(student.getFirstName())
                .studentLastName(student.getLastName())
                .parentId(parent.getId())
                .parentFirstName(parent.getFirstName())
                .parentLastName(parent.getLastName())
                .isKibbutzMember(parent.getIsKibbutzMember())
                .amount(payment.getAmount())
                .chargeMonth(payment.getChargeMonth())
                .status(payment.getStatus())
                .paymentDate(payment.getPaymentDate())
                .paymentMethod(payment.getPaymentMethod())
                .paymentType(payment.getPaymentType())
                .clothingOrderId(
                        payment.getClothingOrder() != null
                                ? payment.getClothingOrder().getId()
                                : null
                )
                .build();
    }
}
