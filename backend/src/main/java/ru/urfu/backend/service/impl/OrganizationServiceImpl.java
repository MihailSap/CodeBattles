package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.OrganizationInvite;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
import ru.urfu.backend.repository.OrganizationRepository;
import ru.urfu.backend.repository.UserOrganizationRepository;
import ru.urfu.backend.service.OrganizationService;

import java.util.List;
import java.util.Optional;

@Service
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserOrganizationRepository userOrganizationRepository;

    @Autowired
    public OrganizationServiceImpl(
            OrganizationRepository organizationRepository,
            UserOrganizationRepository userOrganizationRepository) {
        this.organizationRepository = organizationRepository;
        this.userOrganizationRepository = userOrganizationRepository;
    }

    @Override
    public boolean isUserAdminInOrganization(User user, Organization organization){
        Optional<UserOrganization> userOrganization = userOrganizationRepository.findByUserAndOrganization(user, organization);
        return userOrganization.isPresent() && Boolean.TRUE.equals(userOrganization.get().getAdmin());
    }

    @Override
    public boolean isOrganizationContainsUser(Organization organization, User user) {
        Optional<UserOrganization> userOrganization = userOrganizationRepository.findByUserAndOrganization(user, organization);
        return userOrganization.isPresent() && Boolean.TRUE.equals(userOrganization.get().getEnabled());
    }

    @Override
    public boolean isOrganizationContainsJoinRequest(Organization organization, User user) {
        Optional<UserOrganization> userOrganization = userOrganizationRepository.findByUserAndOrganization(user, organization);
        return userOrganization.isPresent() && Boolean.FALSE.equals(userOrganization.get().getEnabled());
    }

    @Transactional
    @Override
    public Organization create(CreateOrganizationRequestDto request, User user){
        Organization organization = new Organization();
        organization.setTitle(request.name());
        organization.setDescription(request.description());
        organization.setLogo(request.logo());
        organization.setLink(request.link());
        organization.addMember(user, true);

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
            if(organizationRepository.existsByTitle(title)){
                throw new RuntimeException("409 ORGANIZATION_NAME_CONFLICT");
            }
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
                .orElseThrow(() -> new RuntimeException("404 ORGANIZATION_NOT_FOUND"));
    }

    @Override
    public List<Organization> getByUser(User user) {
        return organizationRepository.findByMembers_User(user);
    }

    @Transactional
    @Override
    public UserOrganization createOrganizationJoinRequest(Organization organization, User user){
        UserOrganization userOrganization = new UserOrganization();
        userOrganization.setOrganization(organization);
        userOrganization.setUser(user);
        return userOrganizationRepository.save(userOrganization);
    }

    @Override
    public boolean isOrganizationJoinRequestExists(Organization organization, User user){
        Optional<UserOrganization> userOrganization = userOrganizationRepository.findByUserAndOrganization(user, organization);
        return userOrganization.isPresent();
    }

    @Transactional
    @Override
    public void removeUserOrganization(Organization organization, User user){
        UserOrganization userOrganization = getUserOrganization(user, organization);
        userOrganizationRepository.delete(userOrganization);
    }

    @Override
    public boolean isOrganizationExistsByTitle(String title) {
        return organizationRepository.existsByTitle(title);
    }

    @Transactional
    @Override
    public void approveJoinRequest(Organization organization, User user){
        UserOrganization userOrganization = getUserOrganization(user, organization);
        userOrganization.setEnabled(true);
        userOrganizationRepository.save(userOrganization);
    }

    @Override
    @Transactional
    public Organization addUser(Organization organization, User user) {
        organization.addMember(user, false);
        return organizationRepository.save(organization);
    }

    @Override
    @Transactional
    public void delete(Organization organization){
        organizationRepository.delete(organization);
    }

    @Override
    public UserOrganization getUserOrganization(User user, Organization organization){
        return userOrganizationRepository.findByUserAndOrganization(user, organization)
                .orElseThrow(() -> new RuntimeException("404 ORGANIZATION_JOIN_REQUEST_NOT_FOUND"));
    }
}
