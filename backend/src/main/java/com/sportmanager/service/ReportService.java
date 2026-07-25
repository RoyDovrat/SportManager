package com.sportmanager.service;

import com.sportmanager.dto.response.ClothingOrderResponse;
import com.sportmanager.dto.response.PaymentResponse;
import com.sportmanager.dto.response.RegistrationResponse;
import com.sportmanager.dto.response.SeasonReportResponse;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.PaymentStatus;
import com.sportmanager.enums.RegistrationStatus;
import com.sportmanager.exception.ResourceNotFoundException;
import com.sportmanager.repository.ClothingOrderRepository;
import com.sportmanager.repository.PaymentRepository;
import com.sportmanager.repository.RegistrationRepository;
import com.sportmanager.repository.SeasonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class ReportService {

    private final SeasonRepository seasonRepository;
    private final RegistrationRepository registrationRepository;
    private final PaymentRepository paymentRepository;
    private final ClothingOrderRepository clothingOrderRepository;
    private final RegistrationService registrationService;
    private final PaymentService paymentService;
    private final ClothingOrderService clothingOrderService;

    public ReportService(
            SeasonRepository seasonRepository,
            RegistrationRepository registrationRepository,
            PaymentRepository paymentRepository,
            ClothingOrderRepository clothingOrderRepository,
            RegistrationService registrationService,
            PaymentService paymentService,
            ClothingOrderService clothingOrderService
    ) {
        this.seasonRepository = seasonRepository;
        this.registrationRepository = registrationRepository;
        this.paymentRepository = paymentRepository;
        this.clothingOrderRepository = clothingOrderRepository;
        this.registrationService = registrationService;
        this.paymentService = paymentService;
        this.clothingOrderService = clothingOrderService;
    }

    @Transactional(readOnly = true)
    public SeasonReportResponse getSeasonReport(Long seasonId) {
        Season season = getSeason(seasonId);

        return SeasonReportResponse.builder()
                .seasonId(season.getId())
                .seasonName(season.getName())
                .registrations(buildRegistrationSection(seasonId))
                .payments(buildPaymentSection(seasonId))
                .clothing(buildClothingSection(seasonId))
                .build();
    }

    @Transactional(readOnly = true)
    public SeasonReportResponse.RegistrationReportSection getRegistrationReport(Long seasonId) {
        getSeason(seasonId);
        return buildRegistrationSection(seasonId);
    }

    @Transactional(readOnly = true)
    public SeasonReportResponse.PaymentReportSection getPaymentReport(Long seasonId) {
        getSeason(seasonId);
        return buildPaymentSection(seasonId);
    }

    @Transactional(readOnly = true)
    public SeasonReportResponse.ClothingReportSection getClothingReport(Long seasonId) {
        getSeason(seasonId);
        return buildClothingSection(seasonId);
    }

    private SeasonReportResponse.RegistrationReportSection buildRegistrationSection(Long seasonId) {
        List<RegistrationResponse> items = registrationRepository.findBySeasonId(seasonId).stream()
                .map(registrationService::toResponse)
                .toList();

        return SeasonReportResponse.RegistrationReportSection.builder()
                .total(registrationRepository.countBySeasonId(seasonId))
                .pending(registrationRepository.countBySeasonIdAndStatus(
                        seasonId, RegistrationStatus.PENDING
                ))
                .approved(registrationRepository.countBySeasonIdAndStatus(
                        seasonId, RegistrationStatus.APPROVED
                ))
                .cancelled(registrationRepository.countBySeasonIdAndStatus(
                        seasonId, RegistrationStatus.CANCELLED
                ))
                .activeStudents(registrationRepository.countDistinctStudentsBySeasonIdAndStatus(
                        seasonId, RegistrationStatus.APPROVED
                ))
                .items(items)
                .build();
    }

    private SeasonReportResponse.PaymentReportSection buildPaymentSection(Long seasonId) {
        List<PaymentResponse> items = paymentRepository.findByRegistration_Season_Id(seasonId).stream()
                .map(paymentService::toResponse)
                .toList();

        return SeasonReportResponse.PaymentReportSection.builder()
                .pendingCount(paymentRepository.countByRegistration_Season_IdAndStatus(
                        seasonId, PaymentStatus.PENDING
                ))
                .paidCount(paymentRepository.countByRegistration_Season_IdAndStatus(
                        seasonId, PaymentStatus.PAID
                ))
                .cancelledCount(paymentRepository.countByRegistration_Season_IdAndStatus(
                        seasonId, PaymentStatus.CANCELLED
                ))
                .pendingAmount(nullSafe(paymentRepository.sumAmountBySeasonIdAndStatus(
                        seasonId, PaymentStatus.PENDING
                )))
                .paidAmount(nullSafe(paymentRepository.sumAmountBySeasonIdAndStatus(
                        seasonId, PaymentStatus.PAID
                )))
                .cancelledAmount(nullSafe(paymentRepository.sumAmountBySeasonIdAndStatus(
                        seasonId, PaymentStatus.CANCELLED
                )))
                .items(items)
                .build();
    }

    private SeasonReportResponse.ClothingReportSection buildClothingSection(Long seasonId) {
        List<ClothingOrderResponse> items = clothingOrderRepository
                .findByRegistration_Season_Id(seasonId)
                .stream()
                .map(clothingOrderService::toResponse)
                .toList();

        long alreadyHas = clothingOrderRepository
                .countByRegistration_Season_IdAndAlreadyHasClothing(seasonId, true);
        long total = clothingOrderRepository.countByRegistration_Season_Id(seasonId);

        return SeasonReportResponse.ClothingReportSection.builder()
                .totalOrders(total)
                .ordersRequiringPayment(total - alreadyHas)
                .alreadyHasClothingCount(alreadyHas)
                .items(items)
                .build();
    }

    private Season getSeason(Long seasonId) {
        return seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Season was not found with id: " + seasonId
                ));
    }

    private BigDecimal nullSafe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
