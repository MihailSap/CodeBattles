package ru.urfu.backend.service;

import ru.urfu.backend.dto.notification.NotificationDto;

public interface NotificationRealtimeService {

    void sendUpsert(Long userId, NotificationDto notification);

    void sendDeleted(Long userId, String notificationId);
}
