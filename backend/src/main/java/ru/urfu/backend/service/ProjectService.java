package ru.urfu.backend.service;

import org.springframework.data.domain.Page;
import ru.urfu.backend.dto.project.ProjectCreateRequest;
import ru.urfu.backend.dto.project.ProjectUpdateRequest;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserProject;
import ru.urfu.backend.model.enums.ProjectMemberRole;

import java.util.List;

public interface ProjectService {

    List<Project> getPublicProjects();

    UserProject getUserProject(User user, Project project);

    List<User> getUsersByProject(Project project);

    Project create(ProjectCreateRequest request, Organization organization);

    Project create(ProjectCreateRequest request, User user);

    Page<Project> getAll(int page, int size, String search, String privacy, Long organizationId, String membership);

    List<Project> getAll();

    Project getById(Long id);

    Project getByTitle(String title);

    List<Project> getByOrganization(Organization organization);

    List<Project> getByUser(User user);

    Project update(ProjectUpdateRequest request, Project project);

    void delete(Long id);

    void removeUserFromProject(User user, Project project);

    boolean isProjectExist(String title, Organization organization);

    boolean isProjectExist(String title, User user);

    void addUserToProject(User user, Project project, ProjectMemberRole role);

    boolean isOwner(Project project, User user);
}
