package ru.urfu.backend.service;

import ru.urfu.backend.dto.NotificationSettingsDto;
import ru.urfu.backend.model.NotificationSettings;
import ru.urfu.backend.model.User;

public interface NotificationSettingsService {

    NotificationSettings create(User user);

    NotificationSettings update(NotificationSettings settings, NotificationSettingsDto notificationSettingsDto);
}
