package ru.urfu.backend.dto.review;

public record AiEvaluationDto(
        String status,
        Integer qualityScore,
        String cyclomaticComplexity,
        AiSolidViolationsDto solidViolations,
        String overallComment,
        String errorMessage
) {
}
