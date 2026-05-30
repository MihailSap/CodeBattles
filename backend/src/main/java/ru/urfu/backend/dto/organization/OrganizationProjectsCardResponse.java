package ru.urfu.backend.dto.organization;

import ru.urfu.backend.dto.project.ProjectListItemDto;

import java.util.List;

public record OrganizationProjectsCardResponse(
        Long id,
        String logo,
        String name,
        String link,
        String description,
        Boolean isAdmin,
        List<ProjectListItemDto> projects
) {
}
