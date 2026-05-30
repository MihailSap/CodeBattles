package ru.urfu.backend.dto.dashboard;

import java.util.List;

public record DashboardTasksResponseDto(
        List<DashboardTaskItemDto> items,
        int total
) {
}
