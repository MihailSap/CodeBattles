package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
import ru.urfu.backend.model.enums.OrganizationRole;
import ru.urfu.backend.repository.OrganizationRepository;
import ru.urfu.backend.repository.UserOrganizationRepository;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.service.UserService;

import java.util.List;

@Service
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserOrganizationRepository userOrganizationRepository;
    private final UserService userService;

    @Autowired
    public OrganizationServiceImpl(
            OrganizationRepository organizationRepository,
            UserOrganizationRepository userOrganizationRepository,
            UserService userService) {
        this.organizationRepository = organizationRepository;
        this.userOrganizationRepository = userOrganizationRepository;
        this.userService = userService;
    }

    @Transactional
    @Override
    public Organization create(CreateOrganizationRequestDto request, User user){
        Organization organization = new Organization();
        organization.setTitle(request.name());
        organization.setDescription(request.description());
        organization.setLogo(request.logo());
        organization.setLink(request.link());

        UserOrganization userOrganization = new UserOrganization();
        userOrganization.setOrganization(organization);
        userOrganization.setUser(user);
        userOrganization.setAdmin(true);
        userOrganization.setOrganizationRole(OrganizationRole.TEAM_LEAD); //FIXME: Убрать заглушку
        userOrganizationRepository.save(userOrganization);

        return organizationRepository.save(organization);
    }

    @Override
    public List<Organization> getAll() {
        return organizationRepository.findAll();
    }

    @Override
    public Organization update(UpdateOrganizationRequest request, Organization organization) {
        String title = request.name();
        if(title != null && !title.isEmpty()){
            organization.setTitle(title);
        }

        String description = request.description();
        if(description != null && !description.isEmpty()){
            organization.setDescription(description);
        }

        String link = request.link();
        if(link != null && !link.isEmpty()){
            organization.setLink(link);
        }

        String logoUrl = request.logoUrl();
        if(logoUrl != null && !logoUrl.isEmpty()){
            organization.setLogo(logoUrl);
        }

        return organizationRepository.save(organization);
    }

    @Override
    public Organization getById(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
    }

    @Override
    public List<Organization> getByUser(User user) {
        return organizationRepository.findByMembers_User(user);
    }

    @Override
    @Transactional
    public Organization addUser(Organization organization, UserOrganizationRequest request) throws UserNotFoundException {
        User user = userService.getById(request.userId());
        boolean exists = organization.getMembers().stream()
                .anyMatch(link -> link.getUser().getId().equals(request.userId()));

        if (exists) {
            throw new RuntimeException("User already in organization");
        }

        organization.addMember(user, request.isAdmin(), request.role());

        return organizationRepository.save(organization);
    }

    @Override
    @Transactional
    public Organization removeUser(Organization organization, User user){
        boolean exists = organization.getMembers().stream()
                .anyMatch(link -> link.getUser().getId().equals(user.getId()));

        if (!exists) {
            throw new RuntimeException("User not in organization");
        }

        organization.removeMember(user);

        return organizationRepository.save(organization);
    }

    @Override
    @Transactional
    public void delete(Long id){
        Organization organization = getById(id);
        organizationRepository.delete(organization);
    }
}
