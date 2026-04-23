package ru.urfu.backend.dto.project;

public record ProjectResponse(
        String title,
        String description,
        String stack,
        Boolean isPrivate
) {
}
