package ru.urfu.backend.dto;

import ru.urfu.backend.model.enums.ProjectMemberRole;

public record ProjectMember(
        Long id,
        String login,
        String email,
        String fullName,
        String avatar,
        ProjectMemberRole role) {
}
