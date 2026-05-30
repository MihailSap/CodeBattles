package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.model.SystemSettings;
import ru.urfu.backend.repository.SystemSettingsRepository;
import ru.urfu.backend.service.SystemSettingsService;

@Service
public class SystemSettingsServiceImpl implements SystemSettingsService {

    private final SystemSettingsRepository systemSettingsRepository;

    @Autowired
    public SystemSettingsServiceImpl(SystemSettingsRepository systemSettingsRepository) {
        this.systemSettingsRepository = systemSettingsRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public SystemSettings getSystemSettings() {
        return systemSettingsRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Системные настройки не найдены"));
    }

    @Transactional(readOnly = true)
    @Override
    public int getReviewDeadlineDays() {
        return getSystemSettings().getReviewDeadlineDays();
    }

    @Transactional
    @Override
    public SystemSettings updateReviewDeadline(SystemSettings systemSettings, Integer reviewDeadlineDays){
        systemSettings.setReviewDeadlineDays(reviewDeadlineDays);
        return systemSettingsRepository.save(systemSettings);
    }

    @Transactional
    @Override
    public SystemSettings updateAiSystemPrompt(SystemSettings systemSettings ,String aiSystemPrompt){
        systemSettings.setAiSystemPrompt(aiSystemPrompt);
        return systemSettingsRepository.save(systemSettings);
    }
}
