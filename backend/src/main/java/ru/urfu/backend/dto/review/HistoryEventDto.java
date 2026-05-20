package ru.urfu.backend.dto.review;

public record HistoryEventDto(
        String type,
        String createdAt,
        String description
) {
}

