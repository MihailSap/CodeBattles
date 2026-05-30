package ru.urfu.backend.dto.comment;

public record ReportCommentResponse(
        Long id,
        Long commentId,
        String status
) {
}
