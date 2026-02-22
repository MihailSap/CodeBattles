package ru.urfu.backend.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Запрос с данными пользователя")
public record UserResponse(String email, String login) {
}
