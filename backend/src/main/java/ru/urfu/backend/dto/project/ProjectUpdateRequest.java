package ru.urfu.backend.dto.project;

public record ProjectUpdateRequest(
        String name,
        String description,
        String repositoryUrl,
        String stack,
        Boolean isPrivate,
        Boolean aiReviewEnable
) {
}
