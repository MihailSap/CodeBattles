package ru.urfu.backend.dto.review;

public record CommentResponse(
        Long id,
        Long authorId,
        String authorName,
        String createdAt,
        String text
) {}

