package ru.urfu.backend.dto.review;

import ru.urfu.backend.model.enums.ReviewStatus;

public record ReviewerAssignmentDto(
        Long reviewerId,
        Integer reviewerIndex,
        ReviewStatus status,
        Integer commentsCount,
        Boolean finalReviewSubmitted,
        Long finalReviewId,
        String checkedInTime,
        Boolean expired,
        Boolean allOwnThreadsResolved
) {}

