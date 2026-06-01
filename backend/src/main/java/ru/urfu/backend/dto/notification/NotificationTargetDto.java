package ru.urfu.backend.dto.notification;

public record NotificationTargetDto(
        String kind,
        Long organizationId,
        Long projectId,
        Long taskId,
        Long reviewId,
        String taskName,
        Long userId
) {
}
