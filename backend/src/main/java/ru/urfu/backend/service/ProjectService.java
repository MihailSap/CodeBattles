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

    List<Project> getPublicProjects(User user);

    Page<Project> getAll(
            int page, int size, Sort sort, String search, ProjectPrivacy privacy, Long organizationId,
            ProjectMembershipFilter membership, User currentUser);

    Page<UserProject> getParticipants(
            Project project, int page, int size, Sort sort, String search, ProjectMemberRole role,
            List<Long> excludeSelectedIds);

    ProjectMemberRole getProjectMemberRole(User user, Project project);

    UserProject getUserProject(User user, Project project);

    Project getById(Long id);

    Project create(ProjectCreateRequest request, User user, Organization organization);

    Project create(ProjectCreateRequest request, User user);

    void addUserToProject(User user, Project project, ProjectMemberRole role);

    void removeUserFromProject(User user, Project project);

    Project update(ProjectUpdateRequest request, Project project);

    void delete(Long id);

    boolean isProjectExist(String title, Organization organization);

    boolean isProjectExist(String title, User user);

    boolean isUserOwnerInProject(Project project, User user);

    boolean isUserProjectExists(Project project, User user);

    boolean isUserMemberInProject(Project project, User user);
}
