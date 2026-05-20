package ru.urfu.backend.dto.review;

import java.util.List;

public record ReviewHistoryDto(
        Long id,
        Integer iterationNumber,
        String uploadedAt,
        String completedAt,
        String taskStatusAfterIteration,
        List<FileDto> files,
        List<CommentDto> comments,
        List<FinalReviewDto> finalReviews
) {}

