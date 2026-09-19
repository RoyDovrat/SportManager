package com.sportmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class SportManagerApplication {

	private static final String PRODUCTION_TIME_ZONE = "Asia/Jerusalem";

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(SportManagerApplication.class);
		app.addListeners((ApplicationListener<ApplicationEnvironmentPreparedEvent>) event -> {
			if (event.getEnvironment().matchesProfiles("prod")) {
				TimeZone.setDefault(TimeZone.getTimeZone(PRODUCTION_TIME_ZONE));
			}
		});
		app.run(args);
	}

}
