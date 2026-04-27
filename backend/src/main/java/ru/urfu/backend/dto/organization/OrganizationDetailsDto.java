package ru.urfu.backend.dto.organization;

import ru.urfu.backend.dto.project.ProjectListItemDto;
import ru.urfu.backend.dto.project.ProjectParticipantDto;
import ru.urfu.backend.model.enums.OrganizationRole;

import java.util.List;

public record OrganizationDetailsDto(
    Long id,
    String name,
    String description,
    String link,
    String logoUrl,
    Long ownerId,
    OrganizationRole role,
    List<ProjectParticipantDto> participants,
    List<ProjectListItemDto> projects,
    List<OrganizationJoinRequest> joinRequests
) {
}
