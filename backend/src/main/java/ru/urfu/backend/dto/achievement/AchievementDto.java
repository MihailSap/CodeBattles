package ru.urfu.backend.dto.achievement;

public record AchievementDto(
        Long id,
        String image,
        String name,
        String description,
        Boolean visible
) {
}
