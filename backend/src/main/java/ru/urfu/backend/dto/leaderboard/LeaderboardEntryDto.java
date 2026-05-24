package ru.urfu.backend.dto.leaderboard;

public record LeaderboardEntryDto(
        long id,
        int rank,
        String name,
        String login,
        String avatar,
        LeaderboardMetricsDto metrics
) {}

