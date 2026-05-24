package ru.urfu.backend.dto.admin;

import ru.urfu.backend.model.enums.ReportReason;

import java.time.LocalDateTime;

public record AdminCommentComplaintDto(
        Long id,
        Long commentId,
        String commentText,
        AdminUserBriefDto commentAuthor,
        AdminComplaintTargetDto target,
        ReportReason reason,
        AdminUserBriefDto reportedBy,
        LocalDateTime createdAt
) {
}