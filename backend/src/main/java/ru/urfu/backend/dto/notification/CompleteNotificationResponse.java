package ru.urfu.backend.dto.notification;

import java.util.List;

public record CompleteNotificationResponse(
        List<String> deletedIds
) {
}
