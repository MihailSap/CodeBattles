package ru.urfu.backend.dto.review;

public record FileResponse(
        String fileName,
        String language,
        String content
) {
}

