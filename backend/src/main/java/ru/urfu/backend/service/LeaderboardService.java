package ru.urfu.backend.service;

import ru.urfu.backend.dto.leaderboard.LeaderBoardResponse;
import ru.urfu.backend.dto.leaderboard.LeaderboardCategory;
import ru.urfu.backend.dto.leaderboard.LeaderboardMetricsDto;
import ru.urfu.backend.dto.leaderboard.LeaderboardPeriod;
import ru.urfu.backend.dto.leaderboard.LeaderboardResetRatingResponse;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.User;

public interface LeaderboardService {

    LeaderBoardResponse getGlobalLeaderboard(
            User viewer,
            LeaderboardPeriod period,
            LeaderboardCategory category,
            String query,
            int page,
            int size
    );

    LeaderBoardResponse getOrganizationLeaderboard(
            User viewer,
            Long organizationId,
            LeaderboardPeriod period,
            LeaderboardCategory category,
            String query,
            int page,
            int size
    );

    LeaderBoardResponse getProjectLeaderboard(
            User viewer,
            Long projectId,
            LeaderboardPeriod period,
            LeaderboardCategory category,
            String query,
            int page,
            int size
    );

    LeaderboardMetricsDto getUserGlobalMetrics(User user);

    int getFirstTryAcceptedSolutionsPercent(User user);

    LeaderboardResetRatingResponse resetRating(User admin, Long userId, String reason) throws UserNotFoundException;
}
