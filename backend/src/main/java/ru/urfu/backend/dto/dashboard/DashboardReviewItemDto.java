package ru.urfu.backend.dto.dashboard;

import ru.urfu.backend.model.enums.ReviewStatus;

import java.time.LocalDateTime;

public record DashboardReviewItemDto(
        Long reviewId,
        Long taskId,
        Long projectId,
        String projectName,
        String taskName,
        ReviewStatus status,
        LocalDateTime uploadedAt,
        LocalDateTime deadline
) {
}