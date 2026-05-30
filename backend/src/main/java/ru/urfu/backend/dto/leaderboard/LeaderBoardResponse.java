package ru.urfu.backend.dto.leaderboard;

import java.util.List;

public record LeaderBoardResponse(
        List<LeaderboardEntryDto> content,
        Integer currentUserEntry
) {
}
