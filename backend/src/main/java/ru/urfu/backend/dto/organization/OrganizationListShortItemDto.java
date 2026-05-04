package ru.urfu.backend.dto.organization;

public record OrganizationListShortItemDto(
        Long id,
        String logo,
        String name,
        String link,
        String description,
        Integer participantsCount,
        Integer projectsCount,
        Boolean hasPendingRequest
) {
}
