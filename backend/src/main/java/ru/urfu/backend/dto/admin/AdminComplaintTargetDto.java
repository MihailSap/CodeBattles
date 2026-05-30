package ru.urfu.backend.dto.admin;

public record AdminComplaintTargetDto(
        String kind,
        String title,
        Long projectId,
        Long taskId,
        Long reviewId
) {
}