package ru.urfu.backend.dto.review;

public record ReviewAssigneeResponse(
        Long reviewerId,
        Integer reviewerIndex,
        String status
) {
}

