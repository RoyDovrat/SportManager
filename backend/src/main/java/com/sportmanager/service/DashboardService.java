package com.sportmanager.service;

import com.sportmanager.dto.response.DashboardResponse;
import com.sportmanager.dto.response.PaymentStatusSummary;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.PaymentRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Objects;

@Service
public class DashboardService {

    private final SeasonRepository seasonRepository;
    private final RegistrationRepository registrationRepository;
    private final PaymentRepository paymentRepository;
    private final RegistrationService registrationService;

    public DashboardService(
            SeasonRepository seasonRepository,
            RegistrationRepository registrationRepository,
            PaymentRepository paymentRepository,
            RegistrationService registrationService
    ) {
        this.seasonRepository = seasonRepository;
        this.registrationRepository = registrationRepository;
        this.paymentRepository = paymentRepository;
        this.registrationService = registrationService;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long seasonId) {
        Season season = resolveSeason(seasonId);

        Long resolvedSeasonId = season != null ? season.getId() : null;
        String seasonName = season != null ? season.getName() : null;

        long totalRegistrations = 0;
        long pendingRegistrations = 0;
        long approvedRegistrations = 0;
        long cancelledRegistrations = 0;
        long activeStudents = 0;
        List<RegistrationResponse> recentRegistrations;

        if (resolvedSeasonId != null) {
            totalRegistrations = registrationRepository.countBySeasonId(resolvedSeasonId);
            pendingRegistrations = registrationRepository.countBySeasonIdAndStatus(
                    resolvedSeasonId, RegistrationStatus.PENDING
            );
            approvedRegistrations = registrationRepository.countBySeasonIdAndStatus(
                    resolvedSeasonId, RegistrationStatus.APPROVED
            );
            cancelledRegistrations = registrationRepository.countBySeasonIdAndStatus(
                    resolvedSeasonId, RegistrationStatus.CANCELLED
            );
            activeStudents = registrationRepository.countDistinctStudentsBySeasonIdAndStatus(
                    resolvedSeasonId, RegistrationStatus.APPROVED
            );
            recentRegistrations = registrationRepository
                    .findTop10BySeasonIdOrderByRegistrationDateDescIdDesc(resolvedSeasonId)
                    .stream()
                    .map(registrationService::toResponse)
                    .toList();
        } else {
            recentRegistrations = registrationRepository
                    .findTop10ByOrderByRegistrationDateDescIdDesc()
                    .stream()
                    .map(registrationService::toResponse)
                    .toList();
        }

        long openChargesCount = resolvedSeasonId != null
                ? paymentRepository.countByRegistration_Season_IdAndStatus(
                        resolvedSeasonId, PaymentStatus.PENDING
                )
                : paymentRepository.countByStatus(PaymentStatus.PENDING);

        BigDecimal openChargesAmount = resolvedSeasonId != null
                ? paymentRepository.sumAmountBySeasonIdAndStatus(
                        resolvedSeasonId, PaymentStatus.PENDING
                )
                : paymentRepository.sumAmountByStatus(PaymentStatus.PENDING);

        YearMonth currentMonth = YearMonth.now();
        BigDecimal monthlyIncome = paymentRepository.sumPaidAmountBetween(
                PaymentStatus.PAID,
                currentMonth.atDay(1),
                currentMonth.atEndOfMonth()
        );

        PaymentStatusSummary paymentSummary = buildPaymentSummary(resolvedSeasonId);

        return DashboardResponse.builder()
                .seasonId(resolvedSeasonId)
                .seasonName(seasonName)
                .totalRegistrations(totalRegistrations)
                .pendingRegistrations(pendingRegistrations)
                .approvedRegistrations(approvedRegistrations)
                .cancelledRegistrations(cancelledRegistrations)
                .activeStudents(activeStudents)
                .openChargesCount(openChargesCount)
                .openChargesAmount(zeroIfNull(openChargesAmount))
                .monthlyIncome(zeroIfNull(monthlyIncome))
                .paymentStatusSummary(paymentSummary)
                .recentRegistrations(recentRegistrations)
                .build();
    }

    private PaymentStatusSummary buildPaymentSummary(Long seasonId) {
        long pendingCount;
        long paidCount;
        long cancelledCount;
        BigDecimal pendingAmount;
        BigDecimal paidAmount;
        BigDecimal cancelledAmount;

        if (seasonId != null) {
            pendingCount = paymentRepository.countByRegistration_Season_IdAndStatus(
                    seasonId, PaymentStatus.PENDING
            );
            paidCount = paymentRepository.countByRegistration_Season_IdAndStatus(
                    seasonId, PaymentStatus.PAID
            );
            cancelledCount = paymentRepository.countByRegistration_Season_IdAndStatus(
                    seasonId, PaymentStatus.CANCELLED
            );
            pendingAmount = paymentRepository.sumAmountBySeasonIdAndStatus(
                    seasonId, PaymentStatus.PENDING
            );
            paidAmount = paymentRepository.sumAmountBySeasonIdAndStatus(
                    seasonId, PaymentStatus.PAID
            );
            cancelledAmount = paymentRepository.sumAmountBySeasonIdAndStatus(
                    seasonId, PaymentStatus.CANCELLED
            );
        } else {
            pendingCount = paymentRepository.countByStatus(PaymentStatus.PENDING);
            paidCount = paymentRepository.countByStatus(PaymentStatus.PAID);
            cancelledCount = paymentRepository.countByStatus(PaymentStatus.CANCELLED);
            pendingAmount = paymentRepository.sumAmountByStatus(PaymentStatus.PENDING);
            paidAmount = paymentRepository.sumAmountByStatus(PaymentStatus.PAID);
            cancelledAmount = paymentRepository.sumAmountByStatus(PaymentStatus.CANCELLED);
        }

        return PaymentStatusSummary.builder()
                .pendingCount(pendingCount)
                .paidCount(paidCount)
                .cancelledCount(cancelledCount)
                .pendingAmount(zeroIfNull(pendingAmount))
                .paidAmount(zeroIfNull(paidAmount))
                .cancelledAmount(zeroIfNull(cancelledAmount))
                .build();
    }

    private Season resolveSeason(Long seasonId) {
        if (seasonId != null) {
            return seasonRepository.findById(seasonId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Season was not found with id: " + seasonId));
        }

        List<Season> activeSeasons = seasonRepository.findByIsActive(true);
        if (activeSeasons.isEmpty()) {
            return null;
        }
        return activeSeasons.getFirst();
    }

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return Objects.requireNonNullElse(value, BigDecimal.ZERO);
    }
}
