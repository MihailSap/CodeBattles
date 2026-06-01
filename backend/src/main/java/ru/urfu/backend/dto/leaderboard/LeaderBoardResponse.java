package ru.urfu.backend.dto.leaderboard;

import java.util.List;

public record LeaderBoardResponse(
        List<LeaderboardEntryDto> content,
        LeaderboardEntryDto currentUserEntry,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
