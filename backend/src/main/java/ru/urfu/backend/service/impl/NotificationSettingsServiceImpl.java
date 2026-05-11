package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.NotificationSettingsDto;
import ru.urfu.backend.model.NotificationSettings;
import ru.urfu.backend.model.User;
import ru.urfu.backend.repository.NotificationSettingsRepository;
import ru.urfu.backend.service.NotificationSettingsService;

@Service
public class NotificationSettingsServiceImpl implements NotificationSettingsService {

    private final NotificationSettingsRepository notificationSettingsRepository;

    @Autowired
    public NotificationSettingsServiceImpl(NotificationSettingsRepository notificationSettingsRepository) {
        this.notificationSettingsRepository = notificationSettingsRepository;
    }

    @Transactional
    @Override
    public NotificationSettings create(User user){
        NotificationSettings notificationSettings = new NotificationSettings();
        notificationSettings.setAchievements(true);
        notificationSettings.setNewComments(true);
        notificationSettings.setReviewAssignments(true);
        notificationSettings.setUser(user);
        return notificationSettings;
    }

    @Transactional(readOnly = true)
    @Override
    public NotificationSettings getByUser(User user){
        return notificationSettingsRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException(
                        "Для данного пользователя отсутствуют настройки уведомлений"));
    }

    @Transactional
    @Override
    public NotificationSettings update(NotificationSettings settings, NotificationSettingsDto notificationSettingsDto) {
        Boolean achievements = notificationSettingsDto.achievements();
        if(achievements != null){
            settings.setAchievements(achievements);
        }
        Boolean newComments = notificationSettingsDto.newComments();
        if(newComments != null){
            settings.setNewComments(newComments);
        }
        Boolean reviewAssignments = notificationSettingsDto.reviewAssignments();
        if(reviewAssignments != null){
            settings.setReviewAssignments(reviewAssignments);
        }
        return notificationSettingsRepository.save(settings);
    }
}
