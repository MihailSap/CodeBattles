package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.organization.OrganizationCreateRequest;
import ru.urfu.backend.dto.organization.OrganizationUpdateDataRequest;
import ru.urfu.backend.dto.organization.UserOrganizationRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
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

    @Override
    @Transactional
    public Organization create(OrganizationCreateRequest request) throws UserNotFoundException {
        User owner = userService.getById(request.adminId());
        Organization organization = new Organization();
        organization.setTitle(request.title());
        organization.setDescription(request.description());
        organizationRepository.save(organization);

        UserOrganization userOrganization = new UserOrganization();
        userOrganization.setOrganization(organization);
        userOrganization.setUser(owner);
        userOrganization.setAdmin(true);
        userOrganization.setOrganizationRole(request.role());
        userOrganizationRepository.save(userOrganization);

        List<UserOrganizationRequest> memberRequests = request.members();
        if(memberRequests != null && !memberRequests.isEmpty()){
            for(UserOrganizationRequest memberRequest : memberRequests){
                User member = userService.getById(memberRequest.userId());
                UserOrganization memberOrganization = new UserOrganization();
                memberOrganization.setOrganization(organization);
                memberOrganization.setUser(member);
                memberOrganization.setAdmin(memberRequest.isAdmin());
                memberOrganization.setOrganizationRole(memberRequest.role());
                userOrganizationRepository.save(memberOrganization);
            }
        }

        return organization;
    }

    @Override
    public List<Organization> getAll() {
        return organizationRepository.findAll();
    }

    @Override
    public Organization getById(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
    }

    @Override
    public Organization getByTitle(String title) {
        return organizationRepository.findByTitle(title)
                .orElseThrow(() -> new RuntimeException("Organization not found"));
    }

    @Override
    @Transactional
    public Organization updateData(Organization organization, OrganizationUpdateDataRequest request){
        String title = request.title();
        if(title != null && !title.isEmpty()){
            organization.setTitle(title);
        }

        String description = request.description();
        if(description != null && !description.isEmpty()){
            organization.setDescription(description);
        }

        return organizationRepository.save(organization);
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
