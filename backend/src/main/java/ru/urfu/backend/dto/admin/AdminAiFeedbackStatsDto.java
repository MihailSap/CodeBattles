package ru.urfu.backend.dto.admin;

public record AdminAiFeedbackStatsDto(
        int totalLikes,
        int totalDislikes,
        int periodDays
) {
}

