package ru.urfu.backend.dto.organization;

public record CreateOrganizationRequestDto(
        String name,
        String link,
        String description,
        String logo
) {
}
