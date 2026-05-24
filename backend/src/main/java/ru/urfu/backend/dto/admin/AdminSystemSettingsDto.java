package ru.urfu.backend.dto.admin;

public record AdminSystemSettingsDto(
        int reviewDeadlineDays,
        String aiSystemPrompt,
        AdminAiFeedbackStatsDto aiFeedbackStats
) {
}

