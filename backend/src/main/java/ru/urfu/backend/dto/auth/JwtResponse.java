package ru.urfu.backend.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Ответ, содержащий информацию о токенах")
public record JwtResponse(
        String accessToken,
        String refreshToken,
        String type
) {
    public JwtResponse(String accessToken, String refreshToken) {
        this(accessToken, refreshToken, "Bearer");
    }
}
