package ru.urfu.backend.dto.tasks;

import ru.urfu.backend.dto.project.ProjectParticipantDto;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.TaskStatus;

import java.util.List;

public record TaskListItemResponse(
        Long id,
        Long projectId,
        String name,
        TaskStatus status,
        String deadline,
        ReviewType reviewType,
        List<ProjectParticipantDto> assignees,
        List<ProjectParticipantDto> reviewers,
        Integer commentsCount,
        Boolean hasSolution,
        String createdAt,
        String updatedAt
) {}

