package ru.urfu.backend.dto.invite;

public record InviteRequest(
        String expiresAt,
        Boolean reusable
) {
}
