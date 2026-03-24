package ru.urfu.backend.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Запрос для входа пользователя в аккаунт")
public record LoginRequest(
        @Schema(example = "user@mail.com")
        String email,
        @Schema(example = "1234567890")
        String password) {
}
