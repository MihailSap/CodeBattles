package ru.urfu.backend.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import ru.urfu.backend.dto.project.ProjectCreateRequest;
import ru.urfu.backend.dto.project.ProjectUpdateRequest;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserProject;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.model.enums.ProjectMembershipFilter;
import ru.urfu.backend.model.enums.ProjectPrivacy;

import java.util.List;

public interface ProjectService {

    Page<UserProject> getParticipants(
            Project project,
            int page,
            int size,
            Sort sort,
            String search,
            ProjectMemberRole role,
            List<Long> excludeSelectedIds
    );

    List<Project> getPublicProjects();

    UserProject getUserProject(User user, Project project);

    List<User> getUsersByProject(Project project);

    Page<Project> getAll(int page, int size, String search, String privacy, Long organizationId, String membership);

    List<Project> getAll();

    Project getById(Long id);

    Project getByTitle(String title);

    List<Project> getByOrganization(Organization organization);

    List<Project> getByUser(User user);

    Project create(ProjectCreateRequest request, User user, Organization organization);

    Project create(ProjectCreateRequest request, User user);

    Project update(ProjectUpdateRequest request, Project project);

    boolean isProjectExist(String title, Organization organization);

    boolean isProjectExist(String title, User user);

    void addUserToProject(User user, Project project, ProjectMemberRole role);

    void removeUserFromProject(User user, Project project);

    boolean isUserOwnerInProject(Project project, User user);

    boolean isUserInProject(Project project, User user);

    boolean isUserMemberOfProject(Project project, User user);

    void delete(Long id);

    Page<Project> getAll(
            int page,
            int size,
            Sort sort,
            String search,
            ProjectPrivacy privacy,
            Long organizationId,
            ProjectMembershipFilter membership,
            User currentUser
    );

    Page<Project> searchPublicProjects(
            String q,
            int page,
            int size,
            User user
    );

    Page<Project> getPublicProjectsForSearch(
            int page,
            int size,
            Sort sort,
            String q,
            User currentUser
    );

    ProjectMemberRole getProjectMemberRole(User user, Project project);
}
