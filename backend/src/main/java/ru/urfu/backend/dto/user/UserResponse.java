package ru.urfu.backend.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import ru.urfu.backend.model.Role;

@Schema(name = "Запрос с данными пользователя")
public record UserResponse(
        long id,
        String email,
        String login,
        Role role,
        boolean enabled
) {
}
