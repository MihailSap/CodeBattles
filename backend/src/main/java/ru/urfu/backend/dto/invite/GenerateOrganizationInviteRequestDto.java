package ru.urfu.backend.dto.invite;

public record GenerateOrganizationInviteRequestDto(
        String expiresAt,
        Boolean reusable
) {
}
