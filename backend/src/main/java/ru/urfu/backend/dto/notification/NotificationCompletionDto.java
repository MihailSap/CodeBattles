package ru.urfu.backend.dto.notification;

public record NotificationCompletionDto(
        String action,
        NotificationTargetDto target
) {
}
