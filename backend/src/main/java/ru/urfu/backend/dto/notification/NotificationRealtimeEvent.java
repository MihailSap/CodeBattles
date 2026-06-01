package ru.urfu.backend.dto.notification;

public record NotificationRealtimeEvent(
        String type,
        NotificationDto notification,
        String notificationId
) {
    public static NotificationRealtimeEvent upserted(NotificationDto notification) {
        return new NotificationRealtimeEvent("notification.upserted", notification, null);
    }

    public static NotificationRealtimeEvent deleted(String notificationId) {
        return new NotificationRealtimeEvent("notification.deleted", null, notificationId);
    }
}
