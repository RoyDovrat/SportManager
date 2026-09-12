package com.sportmanager.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WaterAdaptationLevelsMigrator implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        Integer columnCount = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = 'activity_groups'
                  AND column_name = 'water_adaptation_level'
                """,
                Integer.class
        );
        if (columnCount == null || columnCount == 0) {
            return;
        }

        int copied = jdbcTemplate.update(
                """
                INSERT INTO activity_group_water_adaptation_levels (group_id, water_adaptation_level)
                SELECT id, water_adaptation_level
                FROM activity_groups
                WHERE water_adaptation_level IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1
                    FROM activity_group_water_adaptation_levels levels
                    WHERE levels.group_id = activity_groups.id
                  )
                """
        );
        if (copied > 0) {
            log.info("Copied {} swimming group water-adaptation values into the multi-level table.", copied);
        }
    }
}
