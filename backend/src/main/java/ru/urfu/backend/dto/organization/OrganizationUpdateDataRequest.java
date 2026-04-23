package ru.urfu.backend.dto.organization;

public record OrganizationUpdateDataRequest(
        String title,
        String description
) {
}
