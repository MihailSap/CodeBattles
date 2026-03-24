package ru.urfu.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(name = "Ответ с пагинацией")
public record PagedResponse<T>(
        List<T> content,
        long totalElements,
        int totalPages,
        int page,
        int size
) {
}
