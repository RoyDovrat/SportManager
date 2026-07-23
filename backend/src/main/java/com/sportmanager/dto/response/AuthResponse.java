package com.sportmanager.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    private String accessToken;
    private String tokenType;
    private long expiresInMs;
    private String username;
}
