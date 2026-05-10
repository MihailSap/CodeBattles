package ru.urfu.backend.dto.organization;

public record OrganizationListItemResponse(
        Long id,
        String logo,
        String name,
        String link,
        String description,
        Integer participantsCount,
        Integer projectsCount,
        Boolean isAdmin,
        Boolean hasPendingRequest
) {
}
