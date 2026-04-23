package ru.urfu.backend.dto.project;

import ru.urfu.backend.model.enums.ProjectMemberRole;

public record ProjectShortResponse(
        Long id,
        String name,
        String description,
        Boolean isPrivate,
        Long organizationId,
        String organizationName,
        ProjectMemberRole role,
        Integer participantsCount,
        Integer openTasksCount,
        String lastActivityAt
) {
}
