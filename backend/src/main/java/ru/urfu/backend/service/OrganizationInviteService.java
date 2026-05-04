package ru.urfu.backend.service;

import ru.urfu.backend.dto.invite.GenerateOrganizationInviteRequestDto;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.OrganizationInvite;

public interface OrganizationInviteService {

    OrganizationInvite getOrganizationInviteByToken(String token);

    OrganizationInvite create(GenerateOrganizationInviteRequestDto request, Organization organization);

    void deleteOrganizationInvite(String token);
}
