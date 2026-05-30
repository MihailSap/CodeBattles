package ru.urfu.backend.dto.comment;

import ru.urfu.backend.model.enums.ReportReason;

public record ReportCommentRequestDto(
        ReportReason reason,
        String message
) {
}

