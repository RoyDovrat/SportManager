package com.sportmanager.config;

import com.sportmanager.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ActivityDataLoader implements CommandLineRunner {

    private final ActivityService activityService;

    @Override
    public void run(String... args) {
        activityService.ensureDefaultActivities();
    }
}
