package ru.urfu.backend.dto.project;

import ru.urfu.backend.dto.tasks.TaskResponse;
import ru.urfu.backend.model.enums.ProjectMemberRole;

import java.util.List;

public record ProjectFullResponse(
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
        //TODO: add participants
        List<TaskResponse> tasks
) {
}
