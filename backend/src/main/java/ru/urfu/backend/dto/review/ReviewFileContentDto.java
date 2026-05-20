package ru.urfu.backend.dto.review;

public record ReviewFileContentDto(
        String path,
        String language,
        Boolean isDiff,
        String content,
        String originalContent,
        Boolean unsupportedPreview
) {}

