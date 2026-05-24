package ru.urfu.backend.dto.leaderboard;

public record LeaderboardEntityResponse(
        long id,
        String name,
        String lastActivityAt
) {}

