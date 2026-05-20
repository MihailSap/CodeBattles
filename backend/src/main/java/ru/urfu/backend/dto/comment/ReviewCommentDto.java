package ru.urfu.backend.dto.comment;

import ru.urfu.backend.model.enums.CommentAuthorRole;
import ru.urfu.backend.model.enums.ReviewCommentCategory;
import ru.urfu.backend.model.enums.ReviewCommentSeverity;

import java.time.LocalDateTime;
import java.util.List;

public record ReviewCommentDto(
        Long id,
        Long reviewId,
        Long parentId,
        String file,
        Integer startLine,
        Integer endLine,
        String text,
        ReviewCommentCategory category,
        ReviewCommentSeverity severity,
        Long authorId,
        String authorName,
        CommentAuthorRole authorRole,
        Boolean revealName,
        Integer reviewerIndex,
        String createdAt,
        String updatedAt,
        Boolean isClosed,
        String closedAt,
        List<Long> likedBy,
        List<Long> dislikedBy,
        List<ReviewCommentDto> replies
) {}

