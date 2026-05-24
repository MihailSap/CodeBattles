package ru.urfu.backend.dto.admin;

public record AdminUserBriefDto(
        Long id,
        String login,
        String fullName
) {
}