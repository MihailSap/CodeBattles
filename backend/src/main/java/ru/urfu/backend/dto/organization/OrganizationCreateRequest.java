package ru.urfu.backend.dto.organization;

import ru.urfu.backend.model.enums.OrganizationRole;

import java.util.List;

public record OrganizationCreateRequest(
        String title,
        String description,
        OrganizationRole role,
        Long adminId,
        List<UserOrganizationRequest> members
) {
}
