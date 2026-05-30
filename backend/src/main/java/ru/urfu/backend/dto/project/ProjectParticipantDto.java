package ru.urfu.backend.dto.project;

import ru.urfu.backend.model.enums.ProjectMemberRole;

public record ProjectParticipantDto(
        Long id,
        String login,
        String email,
        String fullName,
        String avatar,
        ProjectMemberRole role
) {
}
