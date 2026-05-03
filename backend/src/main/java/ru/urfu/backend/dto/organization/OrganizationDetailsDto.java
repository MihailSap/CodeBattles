package ru.urfu.backend.dto.organization;

import ru.urfu.backend.dto.project.ProjectItemResponse;

import java.util.List;

public record OrganizationDetailsDto(
    Long id,
    String name,
    String description,
    String link,
    String logoUrl,
    Long ownerId,
    String viewerRole,
    List<OrganizationParticipantResponse> participants,
    List<ProjectItemResponse> projects,
    List<OrganizationJoinRequest> joinRequests
) {
}
