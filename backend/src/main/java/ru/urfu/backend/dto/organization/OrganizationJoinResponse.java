package ru.urfu.backend.dto.organization;

import ru.urfu.backend.model.enums.OrganizationJoinStatus;

public record OrganizationJoinResponse(
        Boolean requested,
        Long requestId,
        OrganizationJoinStatus status
) {
}
