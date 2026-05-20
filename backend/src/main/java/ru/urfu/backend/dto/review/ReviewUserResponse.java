package ru.urfu.backend.dto.review;

public record ReviewUserResponse(
        Long id,
        String login,
        String fullName,
        String avatarPath
) {
}
