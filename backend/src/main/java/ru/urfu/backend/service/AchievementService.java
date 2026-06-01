package ru.urfu.backend.service;

import ru.urfu.backend.dto.achievement.AchievementDto;
import ru.urfu.backend.model.User;

import java.util.List;

public interface AchievementService {

    List<AchievementDto> getAchievements(User user, boolean includeHidden);

    List<Long> getReceivedAchievementIds(User user);
}
