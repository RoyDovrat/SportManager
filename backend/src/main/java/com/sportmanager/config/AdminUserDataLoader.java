package com.sportmanager.config;

import com.sportmanager.entity.AdminUser;
import com.sportmanager.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserDataLoader implements CommandLineRunner {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.default-username}")
    private String defaultUsername;

    @Value("${app.admin.default-password}")
    private String defaultPassword;

    @Override
    public void run(String... args) {
        if (adminUserRepository.findByUsername(defaultUsername).isPresent()) {
            return;
        }

        AdminUser adminUser = new AdminUser();
        adminUser.setUsername(defaultUsername);
        adminUser.setPassword(passwordEncoder.encode(defaultPassword));
        adminUser.setIsActive(true);
        adminUserRepository.save(adminUser);

        log.info("Default admin user '{}' was created. Change the password after first login.", defaultUsername);
    }
}
