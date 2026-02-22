package ru.urfu.backend.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Пользователь")
public record UserResponse(String email, String login) {
}
