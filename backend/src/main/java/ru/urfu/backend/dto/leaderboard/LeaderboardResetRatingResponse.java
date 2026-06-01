package ru.urfu.backend.dto.leaderboard;

public record LeaderboardResetRatingResponse(
        long userId,
        boolean ratingReset,
        String resetAt
) {
}
