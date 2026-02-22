package ru.urfu.backend.dto.auth;

public record RegisterRequest(
        String email,
        String login,
        String password
) {
}
