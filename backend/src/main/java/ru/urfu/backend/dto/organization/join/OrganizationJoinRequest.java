package ru.urfu.backend.dto.organization.join;

public record OrganizationJoinRequest(
        Long id,
        Long userId,
        String login,
        String fullName,
        String avatar,
        String createdAt
) {
}
