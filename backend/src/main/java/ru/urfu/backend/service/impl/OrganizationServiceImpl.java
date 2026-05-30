package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;
import ru.urfu.backend.repository.OrganizationRepository;
import ru.urfu.backend.repository.UserOrganizationRepository;
import ru.urfu.backend.service.FileService;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.specification.OrganizationSpecification;
import ru.urfu.backend.specification.UserOrganizationSpecification;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserOrganizationRepository userOrganizationRepository;
    private final UserOrganizationSpecification userOrganizationSpecification;
    private final OrganizationSpecification organizationSpecification;
    private final FileService fileService;

    @Autowired
    public OrganizationServiceImpl(
            OrganizationRepository organizationRepository,
            UserOrganizationRepository userOrganizationRepository,
            UserOrganizationSpecification userOrganizationSpecification, OrganizationSpecification organizationSpecification, FileService fileService) {
        this.organizationRepository = organizationRepository;
        this.userOrganizationRepository = userOrganizationRepository;
        this.userOrganizationSpecification = userOrganizationSpecification;
        this.organizationSpecification = organizationSpecification;
        this.fileService = fileService;
    }

    @Transactional(readOnly = true)
    @Override
    public List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    @Transactional(readOnly = true)
    @Override
    public UserOrganization getUserOrganization(User user, Organization organization){
        return userOrganizationRepository.findByUserAndOrganization(user, organization)
                .orElseThrow(() -> new RuntimeException("404 ORGANIZATION_JOIN_REQUEST_NOT_FOUND"));
    }

    @Transactional(readOnly = true)
    @Override
    public Page<Organization> searchForJoin(User user, String q, int page, int size) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Order.asc("title"),
                        Sort.Order.asc("id")
                )
        );

        Specification<Organization> spec =
                organizationSpecification.searchForJoin(user.getId(), q);

        return organizationRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    @Override
    public Organization getById(Long id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("404 ORGANIZATION_NOT_FOUND"));
    }

    @Transactional(readOnly = true)
    @Override
    public Page<UserOrganization> getMyOrganizations(User user, int page, int size) {
        Pageable pageable = PageRequest.of(
                page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<UserOrganization> spec =
                userOrganizationSpecification.byUser(user);

        return userOrganizationRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    @Override
    public List<UserOrganization> getMyOrganizations(User user) {
        return userOrganizationRepository.findByUserAndIsEnabled_True(user);
    }

    @Transactional(readOnly = true)
    @Override
    public List<Organization> getOrganizationsToJoin(User user) {
        return organizationRepository.findAllWhereUserNotEnabled(user);
    }

    @Transactional
    @Override
    public Organization create(OrganizationCreateRequest request, User user){
        Organization organization = new Organization();
        organization.setTitle(request.name());
        organization.setDescription(request.description());
        organization.setLink(request.link());
        organization.setLastActivityAt(LocalDateTime.now());

        String avatarTitle = fileService.save(request.logo());
        organization.setAvatarFileTitle(avatarTitle);

        organizationRepository.save(organization);

        return addUser(organization, user, true);
    }

    @Transactional
    @Override
    public UserOrganization createOrganizationJoinRequest(Organization organization, User user){
        UserOrganization userOrganization = new UserOrganization();
        userOrganization.setOrganization(organization);
        userOrganization.setUser(user);
        return userOrganizationRepository.save(userOrganization);
    }

    @Transactional
    @Override
    public void removeUserOrganization(Organization organization, User user){
        UserOrganization userOrganization = getUserOrganization(user, organization);
        userOrganizationRepository.delete(userOrganization);
    }

    @Transactional
    @Override
    public void approveJoinRequest(Organization organization, User user){
        UserOrganization userOrganization = getUserOrganization(user, organization);
        userOrganization.setEnabled(true);
        userOrganizationRepository.save(userOrganization);
    }

    @Transactional
    @Override
    public Organization addUser(Organization organization, User user, boolean isAdmin) {
        UserOrganization userOrganization = new UserOrganization();
        userOrganization.setOrganization(organization);
        userOrganization.setUser(user);
        userOrganization.setAdmin(isAdmin);
        userOrganization.setEnabled(true);
        return userOrganizationRepository.save(userOrganization).getOrganization();
    }

    @Transactional
    @Override
    public Organization update(OrganizationUpdateRequest request, Organization organization) {
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

        MultipartFile avatar = request.avatar();
        if(avatar != null){
            String avatarTitle = fileService.save(avatar);
            organization.setAvatarFileTitle(avatarTitle);
        }

        organization.setLastActivityAt(LocalDateTime.now());

        return organizationRepository.save(organization);
    }

    @Transactional
    @Override
    public void delete(Organization organization){
        organizationRepository.delete(organization);
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isOrganizationExistsByTitle(String title) {
        return organizationRepository.existsByTitle(title);
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isOrganizationContainsPendingJoinRequest(Organization organization, User user) {
        Optional<UserOrganization> userOrganization =
                userOrganizationRepository.findByUserAndOrganization(user, organization);
        return userOrganization.isPresent() && Boolean.FALSE.equals(userOrganization.get().getEnabled());
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isUserAdminInOrganization(User user, Organization organization){
        Optional<UserOrganization> userOrganization =
                userOrganizationRepository.findByUserAndOrganization(user, organization);
        return userOrganization.isPresent()
                && Boolean.TRUE.equals(userOrganization.get().getEnabled())
                && Boolean.TRUE.equals(userOrganization.get().getAdmin());
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isUserExistsInOrganization(Organization organization, User user) {
        Optional<UserOrganization> userOrganization =
                userOrganizationRepository.findByUserAndOrganization(user, organization);
        return userOrganization.isPresent() && Boolean.TRUE.equals(userOrganization.get().getEnabled());
    }
}
