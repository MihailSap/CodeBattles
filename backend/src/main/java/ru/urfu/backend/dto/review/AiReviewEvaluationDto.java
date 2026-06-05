package ru.urfu.backend.dto.review;

public record AiReviewEvaluationDto(
        String status,
        Integer qualityScore,
        Integer specificity,
        Integer techDepth,
        Integer correctness,
        Integer nonToxicity,
        String summary,
        String errorMessage
) {}
