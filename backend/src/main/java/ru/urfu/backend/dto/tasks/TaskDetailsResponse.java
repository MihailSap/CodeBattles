package ru.urfu.backend.dto.tasks;

import ru.urfu.backend.model.enums.ReviewType;
import ru.urfu.backend.model.enums.TaskStatus;

import java.util.List;

public record TaskDetailsResponse(
        Long id,
        Long projectId,
        Long organizationId,
        Long solutionId,
        String projectName,
        Boolean isProjectPrivate,
        Boolean aiReviewEnabled,
        String name,
        String description,
        String requirements,
        String evaluationCriteria,
        TaskStatus status,
        String deadline,
        ReviewType reviewType,
        List<Long> assigneeIds,
        List<Long> reviewerIds,
        List<Long> availableAssignees,
        List<Long> availableReviewers,
        PermissionsResponse permissions,
        String createdAt,
        String updatedAt
) {
}
