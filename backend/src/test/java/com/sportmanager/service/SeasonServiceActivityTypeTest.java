package com.sportmanager.service;

import com.sportmanager.dto.request.SeasonRequest;
import com.sportmanager.dto.response.SeasonResponse;
import com.sportmanager.entity.Season;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.repository.SeasonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SeasonServiceActivityTypeTest {

    @Mock
    private SeasonRepository seasonRepository;

    @InjectMocks
    private SeasonService seasonService;

    private Season footballActive;
    private Season swimmingActive;

    @BeforeEach
    void setUp() {
        footballActive = season(1L, "Football 26", ActivityType.FOOTBALL, true);
        swimmingActive = season(2L, "Swimming 26", ActivityType.SWIMMING, true);
    }

    @Test
    void activateFootball_doesNotDeactivateSwimming() {
        Season inactiveFootball = season(3L, "Football Next", ActivityType.FOOTBALL, false);

        when(seasonRepository.findById(3L)).thenReturn(Optional.of(inactiveFootball));
        when(seasonRepository.findByIsActiveAndActivityType(true, ActivityType.FOOTBALL))
                .thenReturn(new ArrayList<>(List.of(footballActive)));
        when(seasonRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(seasonRepository.save(any(Season.class))).thenAnswer(inv -> inv.getArgument(0));

        SeasonResponse response = seasonService.activateSeason(3L);

        assertThat(response.getIsActive()).isTrue();
        assertThat(footballActive.getIsActive()).isFalse();
        assertThat(swimmingActive.getIsActive()).isTrue();

        ArgumentCaptor<List<Season>> captor = ArgumentCaptor.forClass(List.class);
        verify(seasonRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).containsExactly(footballActive);
    }

    @Test
    void createActiveSwimming_onlyDeactivatesOtherSwimming() {
        when(seasonRepository.existsByName("Swim New")).thenReturn(false);
        when(seasonRepository.findByIsActiveAndActivityType(true, ActivityType.SWIMMING))
                .thenReturn(new ArrayList<>(List.of(swimmingActive)));
        when(seasonRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(seasonRepository.save(any(Season.class))).thenAnswer(inv -> {
            Season s = inv.getArgument(0);
            s.setId(9L);
            return s;
        });

        SeasonRequest request = new SeasonRequest();
        request.setName("Swim New");
        request.setStartDate(LocalDate.of(2026, 9, 1));
        request.setEndDate(LocalDate.of(2027, 6, 30));
        request.setActivityType(ActivityType.SWIMMING);
        request.setIsActive(true);

        seasonService.createSeason(request);

        assertThat(swimmingActive.getIsActive()).isFalse();
        assertThat(footballActive.getIsActive()).isTrue();
    }

    private static Season season(Long id, String name, ActivityType type, boolean active) {
        Season season = new Season();
        season.setId(id);
        season.setName(name);
        season.setStartDate(LocalDate.of(2026, 9, 1));
        season.setEndDate(LocalDate.of(2027, 6, 30));
        season.setActivityType(type);
        season.setIsActive(active);
        return season;
    }
}
