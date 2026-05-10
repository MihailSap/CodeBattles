package ru.urfu.backend.service;

import org.springframework.data.domain.Page;
import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;

import java.util.List;

public interface OrganizationService {

    List<UserOrganization> getMyOrganizations(User user);

    Page<UserOrganization> getMyOrganizations(User user, int page, int size);

    Page<Organization> searchForJoin(User user, String q, int page, int size);

    UserOrganization getUserOrganization(User user, Organization organization);

    Organization getById(Long id);

    Organization create(CreateOrganizationRequestDto request, User user);

    void approveJoinRequest(Organization organization, User user);

    void removeUserOrganization(Organization organization, User user);

    UserOrganization createOrganizationJoinRequest(Organization organization, User user);

    Organization addUser(Organization organization, User user, boolean isAdmin);

    Organization update(UpdateOrganizationRequest request, Organization organization);

    void delete(Organization organization);

    boolean isUserAdminInOrganization(User user, Organization organization);

    boolean isUserExistsInOrganization(Organization organization, User user);

    boolean isOrganizationExistsByTitle(String title);

    boolean isOrganizationContainsPendingJoinRequest(Organization organization, User user);
}
