package com.sportmanager.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class CronSecretVerifier {

    private final String expectedSecret;

    public CronSecretVerifier(@Value("${app.cron.secret:}") String expectedSecret) {
        this.expectedSecret = expectedSecret == null ? "" : expectedSecret;
    }

    public boolean matches(String providedSecret) {
        if (expectedSecret.isBlank() || providedSecret == null) {
            return false;
        }
        byte[] expected = expectedSecret.getBytes(StandardCharsets.UTF_8);
        byte[] provided = providedSecret.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, provided);
    }
}
