package ru.urfu.backend.dto.tasks;

import ru.urfu.backend.dto.ProjectMember;
import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.TaskStatus;

import java.util.List;

public record TaskResponse(
        Long id,
        Long projectId,
        String name,
        String description,
        String requirements,
        String evaluationCriteria,
        TaskStatus status,
        String deadline,
        ReviewType reviewType
//        ,
//        List<ProjectMember> assignees
) {
}
