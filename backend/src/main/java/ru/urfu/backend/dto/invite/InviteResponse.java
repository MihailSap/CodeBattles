package ru.urfu.backend.dto.invite;

public record InviteResponse(
    String token,
    String link,
    Long projectId,
    String expiresAt,
    Boolean reusable,
    String createdAt
) {
}
