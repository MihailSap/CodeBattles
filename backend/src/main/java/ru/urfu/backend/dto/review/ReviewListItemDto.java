package ru.urfu.backend.dto.review;

import ru.urfu.backend.model.enums.ReviewStatus;

public record ReviewListItemDto(
        Long id,
        Long taskId,
        String taskName,
        ReviewProjectResponse project,
        ReviewOrganizationResponse organization,
        String uploadedAt,
        String deadline,
        ReviewStatus status,
        Integer commentsCount,
        Boolean checkedInTime,
        Boolean expired,
        Boolean allOwnThreadsResolved,
        String completedAt,
        String visibleUntil
) {}

