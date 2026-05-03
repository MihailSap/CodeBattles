package ru.urfu.backend.dto.organization;

public record OrganizationParticipantResponse(
        Long id,
        String login,
        String email,
        String fullName,
        String avatar,
        String role
) {
}
