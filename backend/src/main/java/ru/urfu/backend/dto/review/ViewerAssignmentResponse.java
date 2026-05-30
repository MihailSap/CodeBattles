package ru.urfu.backend.dto.review;

import ru.urfu.backend.model.enums.ReviewStatus;

public record ViewerAssignmentResponse(
        Long reviewerId,
        ReviewStatus status,
        Integer commentsCount,
        Boolean finalReviewSubmitted,
        Boolean checkedInTime,
        Boolean expired,
        Boolean allOwnThreadsResolved
) {
}

