package ru.urfu.backend.dto.review;

public record CommentDto(
        Long id,
        Long authorId,
        String authorName,
        String createdAt,
        String text
) {}

