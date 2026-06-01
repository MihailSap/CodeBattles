package ru.urfu.backend.dto.admin;

public record ResetRatingResponse(
        Long userId,
        String message
) {
}
