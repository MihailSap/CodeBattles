package ru.urfu.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Ответ, содержащий информацию об ошибке")
public record ErrorResponse(String message) {
}
