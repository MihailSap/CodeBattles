package ru.urfu.backend.dto.project;

import java.util.List;

public record ProjectUpdateRequest(
        String name,
        String description,
        String repositoryUrl,
        List<String> stack,
        Boolean isPrivate,
        Boolean aiReviewEnable
) {
}
