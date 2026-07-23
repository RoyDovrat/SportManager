package com.sportmanager.security;

import com.sportmanager.entity.AdminUser;
import com.sportmanager.repository.AdminUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserDetailsService implements UserDetailsService {

    private final AdminUserRepository adminUserRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        AdminUser adminUser = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Admin user was not found: " + username
                ));

        if (!Boolean.TRUE.equals(adminUser.getIsActive())) {
            throw new UsernameNotFoundException("Admin user is inactive: " + username);
        }

        return User.builder()
                .username(adminUser.getUsername())
                .password(adminUser.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .disabled(!Boolean.TRUE.equals(adminUser.getIsActive()))
                .build();
    }
}
