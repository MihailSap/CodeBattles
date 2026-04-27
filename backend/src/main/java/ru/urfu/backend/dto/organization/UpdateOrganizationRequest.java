package ru.urfu.backend.dto.organization;

public record UpdateOrganizationRequest(
        String name,
        String description,
        String link,
        String logoUrl
) {
}
