package ru.urfu.backend.dto.dashboard;

import java.util.List;

public record DashboardReviewsResponseDto(
        List<DashboardReviewItemDto> items,
        Integer total
) {
}