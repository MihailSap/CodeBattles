package ru.urfu.backend.dto.solution;

import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.TaskStatus;

public record ReviewFinishResponse(
        Long taskId,
        TaskStatus taskStatus,
        Long reviewId,
        ReviewStatus reviewStatus,
        String completedAt
) {
}
