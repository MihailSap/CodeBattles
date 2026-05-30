package ru.urfu.backend.dto.user;

import ru.urfu.backend.model.enums.Role;

public record UserRoleResponse(Long id, Role role) {
}
