package com.sportmanager.config;

import com.sportmanager.controller.SeasonController;
import com.sportmanager.dto.response.SeasonResponse;
import com.sportmanager.enums.ActivityType;
import com.sportmanager.security.AdminUserDetailsService;
import com.sportmanager.security.JwtAuthenticationFilter;
import com.sportmanager.security.JwtService;
import com.sportmanager.service.SeasonService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SeasonController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class PublicSeasonActiveByTypeSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SeasonService seasonService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AdminUserDetailsService adminUserDetailsService;

    @Test
    void anonymousCanGetActiveSeasonByActivityType() throws Exception {
        when(seasonService.getActiveSeason(ActivityType.FOOTBALL)).thenReturn(
                SeasonResponse.builder()
                        .id(1L)
                        .name("Football 26")
                        .startDate(LocalDate.of(2026, 9, 1))
                        .endDate(LocalDate.of(2027, 6, 30))
                        .activityType(ActivityType.FOOTBALL)
                        .isActive(true)
                        .build()
        );

        mockMvc.perform(get("/api/seasons/active/FOOTBALL"))
                .andExpect(status().isOk());
    }

    @Test
    void anonymousCannotListAllSeasons() throws Exception {
        mockMvc.perform(get("/api/seasons"))
                .andExpect(status().isUnauthorized());
    }
}
