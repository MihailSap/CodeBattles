package ru.urfu.backend.dto.review;

public record FileDto(
        String name,
        String path,
        Long size
) {
}

