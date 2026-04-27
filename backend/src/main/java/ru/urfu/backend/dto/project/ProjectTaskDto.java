package ru.urfu.backend.dto.project;

import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.TaskStatus;

import java.util.List;

public record ProjectTaskDto(
        Long id,
        Long projectId,
        String name,
        String description,
        String requirements,
        String evaluationCriteria,
        TaskStatus status,
        String deadline,
        ReviewType reviewType,
        List<ProjectParticipantDto> assignees
) {
}
