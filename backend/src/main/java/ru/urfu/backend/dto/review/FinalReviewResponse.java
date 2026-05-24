package ru.urfu.backend.dto.review;

import ru.urfu.backend.model.enums.ReviewVerdictType;

public record FinalReviewResponse(
        Long id,
        Long reviewerId,
        Integer reviewerIndex,
        String reviewerName,
        Boolean revealAuthorReview,
        Boolean revealAuthorSolution,
        Integer architecture,
        Integer readability,
        Integer testability,
        Integer scalability,
        Integer overallScore,
        String comment,
        ReviewVerdictType verdict,
        String createdAt,
        Boolean counted,
        Boolean expired
) {}

