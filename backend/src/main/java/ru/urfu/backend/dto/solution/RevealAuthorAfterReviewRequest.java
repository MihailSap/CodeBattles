package ru.urfu.backend.dto.solution;

public record RevealAuthorAfterReviewRequest(
        Long solutionId,
        Boolean revealAuthorAfterReview) {
}
