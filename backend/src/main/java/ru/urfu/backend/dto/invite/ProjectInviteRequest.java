package ru.urfu.backend.dto.invite;

public record ProjectInviteRequest(
        String expiresAt,
        Boolean reusable
) {
}
