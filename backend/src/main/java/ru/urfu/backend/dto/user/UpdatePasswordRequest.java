package ru.urfu.backend.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Запрос для обновления пароля пользователя")
public record UpdatePasswordRequest(
        @Schema(example = "0987654321")
        String newPassword) {
}
