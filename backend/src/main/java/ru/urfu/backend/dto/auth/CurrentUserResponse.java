package ru.urfu.backend.dto.auth;

import ru.urfu.backend.model.enums.Role;

public record CurrentUserResponse(
        Long id,
        String name,
        String email,
        String login,
        String registeredAt,
        String avatarPath,
        Role role,
        Boolean enabled
) {
}
