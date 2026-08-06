package com.sportmanager.scheduling;

import com.sportmanager.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MonthlyPaymentScheduler {

    private final PaymentService paymentService;

    /**
     * Each day, ensure a PENDING monthly payment exists for the current calendar month
     * for every approved registration in a season that covers this month.
     * Safe to re-run: existing active payments are skipped.
     */
    @Scheduled(cron = "0 15 1 * * *")
    public void createCurrentMonthPayments() {
        var result = paymentService.generateCurrentMonthPaymentsForCoveringSeasons();
        log.info(
                "Monthly payment job finished: created={}, skipped={}",
                result.getCreatedCount(),
                result.getSkippedCount()
        );
    }
}
