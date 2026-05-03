package ru.urfu.backend.dto.invite;

public record OrganizationInviteDto(
        String token,
        Long organizationId,
        String expiresAt,
        Boolean reusable,
        String createdAt,
        String link
) {
}
