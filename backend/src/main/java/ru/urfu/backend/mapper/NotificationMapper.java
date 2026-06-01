package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.notification.NotificationCompletionDto;
import ru.urfu.backend.dto.notification.NotificationDto;
import ru.urfu.backend.dto.notification.NotificationTargetDto;
import ru.urfu.backend.model.Notification;
import ru.urfu.backend.model.enums.NotificationTargetKind;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Component
public class NotificationMapper {

    public NotificationDto mapToDto(Notification notification) {
        NotificationTargetDto target = mapTarget(notification, false);
        NotificationCompletionDto completion = notification.getCompletionAction() == null
                ? null
                : new NotificationCompletionDto(notification.getCompletionAction().name(), mapTarget(notification, true));

        return new NotificationDto(
                String.valueOf(notification.getId()),
                notification.getType().name(),
                notification.getTitle(),
                notification.getText(),
                Boolean.TRUE.equals(notification.getRead()),
                formatDate(notification.getCreatedAt()),
                formatDate(notification.getExpiresAt()),
                formatDate(notification.getDeadline()),
                target,
                completion,
                notification.getThreadReplyCount()
        );
    }

    private NotificationTargetDto mapTarget(Notification notification, boolean includeUser) {
        NotificationTargetKind targetKind = notification.getTargetKind();
        if (targetKind == null) {
            return null;
        }

        return new NotificationTargetDto(
                toClientKind(targetKind),
                notification.getOrganizationId(),
                notification.getProjectId(),
                notification.getTaskId(),
                notification.getReviewId(),
                notification.getTaskName(),
                includeUser ? notification.getTargetUserId() : null
        );
    }

    private String toClientKind(NotificationTargetKind kind) {
        return kind.name().toLowerCase();
    }

    private String formatDate(LocalDateTime value) {
        if (value == null) {
            return null;
        }

        return value.atOffset(ZoneOffset.UTC).toInstant().toString();
    }
}
