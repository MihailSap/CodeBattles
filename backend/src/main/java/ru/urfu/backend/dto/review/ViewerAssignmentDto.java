package ru.urfu.backend.dto.review;

public record ViewerAssignmentDto(
        Long reviewerId,
        String status,
        Integer commentsCount,
        Boolean finalReviewSubmitted,
        String checkedInTime,
        Boolean expired,
        Boolean allOwnThreadsResolved
) {}

