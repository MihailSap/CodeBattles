package ru.urfu.backend.dto.admin;

import java.time.LocalDateTime;

public record AdminEventDto(
        Long id,
        String type,
        LocalDateTime createdAt,
        AdminUserBriefDto actor,
        AdminUserBriefDto targetUser,
        AdminComplaintTargetDto target,
        String reason,
        String decision,
        String consequence,
        Long commentId,
        String commentTextPreview,
        Long removedCommentId,
        Integer penaltyPoints,
        String details,
        AdminEventScopeDto scope,
        String previousValue,
        String newValue
) {
}
