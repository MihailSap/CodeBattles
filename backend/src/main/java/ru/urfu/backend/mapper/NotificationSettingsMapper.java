package ru.urfu.backend.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.backend.dto.NotificationSettingsDto;
import ru.urfu.backend.model.NotificationSettings;

@Component
public class NotificationSettingsMapper {

    public NotificationSettingsDto mapToNotificationSettingsDto(NotificationSettings notificationSettings) {
        return new NotificationSettingsDto(
                notificationSettings.getReviewAssignments(),
                notificationSettings.getNewComments(),
                notificationSettings.getAchievements()
        );
    }
}
