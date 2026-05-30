package ru.urfu.backend.dto.admin;

public record ResolveAdminCommentComplaintResponse(
        Long complaintId,
        CommentReportDecision decision,
        String consequence,
        Long removedCommentId,
        Integer penaltyPoints
) {
}
