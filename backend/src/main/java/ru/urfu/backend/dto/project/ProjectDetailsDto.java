package ru.urfu.backend.dto.project;

import ru.urfu.backend.model.enums.ProjectMemberRole;

import java.util.List;

public record ProjectDetailsDto(
        Long id,
        Long organizationId,
        String organizationName,
        String name,
        String description,
        List<String> stack,
        Boolean isPrivate,
        Boolean aiReviewEnabled,
        String repositoryUrl,
        String lastActivityAt,
        ProjectMemberRole viewerRole,
        Boolean canSeeTasks,
        List<Long> participantsIds,
        List<Long> taskIds
) {
}
