package ru.urfu.backend.dto.project;

import ru.urfu.backend.model.enums.ProjectMemberRole;

public record ProjectJoinedResponse(
        Boolean joined,
        Long projectId
) {
}
