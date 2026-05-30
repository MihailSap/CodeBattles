package ru.urfu.backend.dto.solution;

import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.TaskStatus;

public record SolutionSubmitResponse(
        Long solutionId,
        Long taskId,
        TaskStatus taskStatus,
        ReviewStatus reviewStatus,
        String uploadedAt,
        String reviewDeadline
) {
}

