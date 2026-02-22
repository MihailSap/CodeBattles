package ru.urfu.backend.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Запрос для регистрации пользователя")
public record RegisterRequest(
        @Schema(example = "user@mail.com")
        String email,
        @Schema(example = "user")
        String login,
        @Schema(example = "1234567890")
        String password
) {
}
