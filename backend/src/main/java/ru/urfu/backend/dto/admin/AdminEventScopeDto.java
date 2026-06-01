package ru.urfu.backend.dto.admin;

public record AdminEventScopeDto(
        String type,
        String name,
        String url,
        Long organizationId,
        Long projectId
) {
}
