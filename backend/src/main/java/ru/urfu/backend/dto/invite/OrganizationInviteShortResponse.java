package ru.urfu.backend.dto.invite;

public record OrganizationInviteShortResponse(
        Long organizationId,
        String organizationName,
        String expiresAt,
        Boolean reusable
) {
}
