package ru.urfu.backend.dto.comment;

import ru.urfu.backend.model.enums.ReviewCommentCategory;
import ru.urfu.backend.model.enums.ReviewCommentSeverity;

public record CreateReviewCommentRequest(
        Long reviewId,
        String file,
        Integer startLine,
        Integer endLine,
        String text,
        ReviewCommentCategory category,
        ReviewCommentSeverity severity
) {}

