package ru.urfu.backend.dto.organization;

import ru.urfu.backend.dto.project.ProjectResponse;
import ru.urfu.backend.dto.user.UserResponse;

import java.util.List;

/**
 * TODO: Отображать роли
 */
public record OrganizationResponse(
        String title,
        String description,
        List<UserResponse> users,
        List<ProjectResponse> projects
) {
}
