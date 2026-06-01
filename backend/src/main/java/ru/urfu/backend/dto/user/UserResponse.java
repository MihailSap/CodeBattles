package ru.urfu.backend.dto.user;

import io.swagger.v3.oas.annotations.media.Schema;
import ru.urfu.backend.dto.achievement.AchievementDto;
import ru.urfu.backend.model.enums.Role;

import java.util.List;

@Schema(name = "Запрос с данными пользователя")
public record UserResponse(
        Long id,
        String email,
        String login,
        String fullName,
        String avatar,
        String registeredAt,
        Role role,
        Boolean enabled,
        List<String> clouds,
        List<String> databases,
        List<String> frameworks,
        List<String> languages,
        List<String> tools,
        Double qualityScore,
        Double aiQualityScore,
        Double usefulnessIndex,
        Integer reviewDepth,
        Integer acceptedDecisionsPercent,
        List<Long> receivedAchievementIds,
        List<AchievementDto> achievements
) {
}
