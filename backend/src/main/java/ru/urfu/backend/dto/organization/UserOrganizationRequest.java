package ru.urfu.backend.dto.organization;

import ru.urfu.backend.model.enums.OrganizationRole;

public record UserOrganizationRequest(
        Long userId,
        OrganizationRole role,
        Boolean isAdmin
) {
}
