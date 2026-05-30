package ru.urfu.backend.dto.leaderboard;

public record LeaderboardMetricsDto(
        double totalRating,
        double codeQuality,
        double aiCodeQuality,
        int fixedCommentsPercent,
        double aiReviewQuality,
        int likesCount,
        int reviewDepthPercent,
        int completedReviewsCount,
        int completedTasksCount
) {}

