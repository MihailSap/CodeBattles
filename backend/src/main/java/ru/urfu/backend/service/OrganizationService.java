package ru.urfu.backend.service;

import ru.urfu.backend.dto.organization.*;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;

import java.util.List;

public interface OrganizationService {

    List<Organization> getAll();

    Organization getById(Long id);

    List<Organization> getByUser(User user);

    Organization create(CreateOrganizationRequestDto request, User user);

    Organization update(UpdateOrganizationRequest request, Organization organization);

    Organization addUser(Organization organization, UserOrganizationRequest request) throws UserNotFoundException;

    Organization removeUser(Organization organization, User user);

    void delete(Long id);
}
