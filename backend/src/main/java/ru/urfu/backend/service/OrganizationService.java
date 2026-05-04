package ru.urfu.backend.service;

import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserOrganization;

import java.util.List;

public interface OrganizationService {

    UserOrganization getUserOrganization(User user, Organization organization);

    List<Organization> getAll();

    Organization getById(Long id);

    List<Organization> getByUser(User user);

    Organization create(CreateOrganizationRequestDto request, User user);

    Organization update(UpdateOrganizationRequest request, Organization organization);

    boolean isUserAdminInOrganization(User user, Organization organization);

    void delete(Organization organization);

    boolean isOrganizationContainsUser(Organization organization, User user);

    Organization addUser(Organization organization, User user);

    boolean isOrganizationContainsJoinRequest(Organization organization, User user);

    void approveJoinRequest(Organization organization, User user);

    UserOrganization createOrganizationJoinRequest(Organization organization, User user);

    boolean isOrganizationJoinRequestExists(Organization organization, User user);

    void removeUserOrganization(Organization organization, User user);

    boolean isOrganizationExistsByTitle(String title);
}
