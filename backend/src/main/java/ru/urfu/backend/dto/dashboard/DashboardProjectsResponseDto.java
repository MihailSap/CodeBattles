package ru.urfu.backend.dto.dashboard;

import java.util.List;

public record DashboardProjectsResponseDto(
        List<DashboardProjectFilterItemDto> items
) {
}
