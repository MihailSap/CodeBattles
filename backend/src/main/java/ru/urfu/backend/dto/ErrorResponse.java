package ru.urfu.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(name = "Ответ, содержащий информацию об ошибке")
public record ErrorResponse(
        Instant timestamp,
        Integer status,
        String code,
        String message,
        String path) {
}
