package ru.urfu.backend.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Запрос для обновления логина пользователя")
public record UpdateLoginRequest(
        @Schema(example = "new_user")
        String newLogin) {
}
