package ru.urfu.backend.service;

import ru.urfu.backend.dto.organization.OrganizationCreateRequest;
import ru.urfu.backend.dto.organization.OrganizationUpdateDataRequest;
import ru.urfu.backend.dto.organization.UserOrganizationRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.User;

import java.util.List;

public interface OrganizationService {

    Organization create(OrganizationCreateRequest request) throws UserNotFoundException;

    List<Organization> getAll();

    Organization getById(Long id);

    Organization getByTitle(String title);

    Organization updateData(Organization organization, OrganizationUpdateDataRequest request);

    Organization addUser(Organization organization, UserOrganizationRequest request) throws UserNotFoundException;

    Organization removeUser(Organization organization, User user);

    void delete(Long id);
}
