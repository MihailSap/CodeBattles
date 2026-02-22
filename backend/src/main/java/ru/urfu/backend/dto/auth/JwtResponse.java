package ru.urfu.backend.dto.auth;

public record JwtResponse(
        String accessToken,
        String refreshToken,
        String type
) {
    public JwtResponse(String accessToken, String refreshToken) {
        this(accessToken, refreshToken, "Bearer");
    }
}
