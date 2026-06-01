package ru.urfu.backend.dto.notification;

public record NotificationDto(
        String id,
        String type,
        String title,
        String text,
        boolean isRead,
        String createdAt,
        String expiresAt,
        String deadline,
        NotificationTargetDto target,
        NotificationCompletionDto completion,
        Integer threadReplyCount
) {
}
