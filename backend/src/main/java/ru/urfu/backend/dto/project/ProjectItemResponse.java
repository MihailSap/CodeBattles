package ru.urfu.backend.dto.project;

import ru.urfu.backend.model.enums.ProjectMemberRole;

import java.util.List;

public record ProjectItemResponse(
        Long id,
        String name,
        String description,
        Integer activeTasksCount,
        List<ProjectParticipantDto> participants,
        ProjectMemberRole viewerRole
) {
}
