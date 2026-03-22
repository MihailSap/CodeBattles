package ru.urfu.backend.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Запрос для смены пароля при восстановлении")
public record PasswordResetRequest(
        String token,
        @Schema(example = "9876543210")
        String password) {
}
