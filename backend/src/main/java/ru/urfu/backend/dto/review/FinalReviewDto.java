package ru.urfu.backend.dto.review;

public record FinalReviewDto(
        Long id,
        Long reviewerId,
        Integer reviewerIndex,
        String reviewerName,
        Boolean revealName,
        Integer architecture,
        Integer readability,
        Integer testability,
        Integer scalability,
        Integer overallScore,
        String comment,
        String verdict,
        String createdAt,
        Boolean counted,
        Boolean expired
) {}

