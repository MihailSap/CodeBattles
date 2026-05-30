package ru.urfu.backend.dto.review;

import ru.urfu.backend.model.enums.ReviewStatus;
import ru.urfu.backend.model.enums.TaskStatus;

public record SubmitFinalReviewResponse(
        Long reviewId,
        ReviewStatus assignmentStatus,
        TaskStatus taskStatus,
        FinalReviewResponse finalReview
) {
}
