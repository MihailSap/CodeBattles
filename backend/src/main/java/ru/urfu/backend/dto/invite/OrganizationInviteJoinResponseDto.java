package ru.urfu.backend.dto.invite;

public record OrganizationInviteJoinResponseDto(
        Boolean joined,
        Long organizationId
) {
}
