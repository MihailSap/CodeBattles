package ru.urfu.backend.dto.leaderboard;

public record LeaderboardMetricsDto(
        double totalRating,
        double codeQuality,
        Double aiCodeQuality,
        int fixedCommentsPercent,
        Double aiReviewQuality,
        int likesCount,
        int reviewDepthPercent,
        int completedReviewsCount,
        int completedTasksCount
) {}
