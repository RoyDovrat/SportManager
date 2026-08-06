package com.sportmanager.service;

import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PaymentServiceSwimmingScheduleBillingTest {

    @Test
    void tuesdayOnly_monthEndingMonday_hasOneFewerThanFiveWeekEstimate() {
        // September 2025: Mon 1 … Tue 30 → 5 Tuesdays
        assertThat(PaymentService.countSessionOccurrences(
                List.of(DayOfWeek.TUESDAY),
                YearMonth.of(2025, 9),
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 12, 31)
        )).isEqualTo(5);

        // February 2026: Sun 1 … Sat 28 → 4 Tuesdays (not 4.5×weeks Mondays proxy)
        assertThat(PaymentService.countSessionOccurrences(
                List.of(DayOfWeek.TUESDAY),
                YearMonth.of(2026, 2),
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31)
        )).isEqualTo(4);
    }

    @Test
    void clipsOccurrencesToSeasonDateRange() {
        // March 2026 has 5 Tuesdays, but season starts mid-month
        int count = PaymentService.countSessionOccurrences(
                List.of(DayOfWeek.TUESDAY),
                YearMonth.of(2026, 3),
                LocalDate.of(2026, 3, 15),
                LocalDate.of(2026, 6, 30)
        );
        // Tuesdays on/after Mar 15: 17, 24, 31 → 3
        assertThat(count).isEqualTo(3);
    }

    @Test
    void countsMultipleWeekdaysIndependently() {
        int count = PaymentService.countSessionOccurrences(
                List.of(DayOfWeek.TUESDAY, DayOfWeek.THURSDAY),
                YearMonth.of(2026, 2),
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 12, 31)
        );
        // Feb 2026: 4 Tuesdays + 4 Thursdays = 8
        assertThat(count).isEqualTo(8);
    }
}
