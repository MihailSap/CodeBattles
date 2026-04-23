package ru.urfu.backend.dto.userProject;

import ru.urfu.backend.model.enums.ProjectMemberRole;

public record AddUserToProjectRequest(
        Long userId,
        Long projectId,
        ProjectMemberRole role
) {
}
