package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.invite.GenerateOrganizationInviteRequestDto;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.OrganizationInvite;
import ru.urfu.backend.repository.OrganizationInviteRepository;
import ru.urfu.backend.service.OrganizationInviteService;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class OrganizationInviteServiceImpl implements OrganizationInviteService {

    private final OrganizationInviteRepository organizationInviteRepository;

    @Autowired
    public OrganizationInviteServiceImpl(OrganizationInviteRepository organizationInviteRepository) {
        this.organizationInviteRepository = organizationInviteRepository;
    }

    @Override
    public OrganizationInvite getOrganizationInviteByToken(String token) {
        return organizationInviteRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("400 INVALID_INVITE"));
    }

    @Transactional
    @Override
    public OrganizationInvite create(GenerateOrganizationInviteRequestDto request, Organization organization){
        OrganizationInvite organizationInvite = new OrganizationInvite();
        organizationInvite.setOrganization(organization);
        organizationInvite.setToken(UUID.randomUUID().toString());
        organizationInvite.setReusable(request.reusable());
        organizationInvite.setExpiresAt(LocalDateTime.parse(request.expiresAt()));
        return organizationInviteRepository.save(organizationInvite);
    }

    @Transactional
    public void deleteOrganizationInvite(String token){
        OrganizationInvite organizationInvite = getOrganizationInviteByToken(token);
        organizationInviteRepository.delete(organizationInvite);
    }
}
