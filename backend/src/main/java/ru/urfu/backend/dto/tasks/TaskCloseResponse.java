package ru.urfu.backend.dto.tasks;

import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.TaskStatus;

import java.util.List;

public record TaskCloseResponse(
        Long taskId,
        TaskStatus taskStatus,
        List<Long> reviewId,
        ReviewStatus reviewStatus,
        String completedAt
) {
}
