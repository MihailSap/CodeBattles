package ru.urfu.backend.dto.admin;

public record AdminComplaintTargetDto(
        String kind,
        String title,
        String url,
        Long projectId,
        Long taskId,
        Long reviewId
) {
}
