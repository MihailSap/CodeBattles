package ru.urfu.backend.service;

import ru.urfu.backend.model.SystemSettings;

public interface SystemSettingsService {

    SystemSettings getSystemSettings();

    int getReviewDeadlineDays();

    SystemSettings updateReviewDeadline(SystemSettings systemSettings, Integer reviewDeadlineDays);

    SystemSettings updateAiSystemPrompt(SystemSettings systemSettings ,String aiSystemPrompt);
}
