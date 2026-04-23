package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.backend.dto.project.ProjectCreateRequest;
import ru.urfu.backend.dto.project.ProjectUpdateRequest;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.model.UserProject;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.repository.ProjectRepository;
import ru.urfu.backend.repository.UserProjectRepository;
import ru.urfu.backend.service.ProjectService;
import ru.urfu.backend.specification.ProjectSpecification;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectSpecification projectSpecification;
    private final UserProjectRepository userProjectRepository;

    @Autowired
    public ProjectServiceImpl(ProjectRepository projectRepository, ProjectSpecification projectSpecification, UserProjectRepository userProjectRepository) {
        this.projectRepository = projectRepository;
        this.projectSpecification = projectSpecification;
        this.userProjectRepository = userProjectRepository;
    }

    @Override
    @Transactional
    public Project create(ProjectCreateRequest request, Organization organization){
        Project project = new Project();
        project.setOrganization(organization);
        project.setTitle(request.name());
        project.setDescription(request.description());
        project.setRepositoryUrl(request.repositoryUrl());
        project.setStack(request.stack());
        project.setPrivate(request.isPrivate());
        project.setAiReviewEnabled(request.aiReviewEnabled());
        return projectRepository.save(project);
    }

    @Override
    @Transactional
    public Project create(ProjectCreateRequest request, User user){
        Project project = new Project();
        project.setTitle(request.name());
        project.setDescription(request.description());
        project.setRepositoryUrl(request.repositoryUrl());
        project.setStack(request.stack());
        project.setPrivate(request.isPrivate());
        project.setAiReviewEnabled(request.aiReviewEnabled());
        project.addUser(user, ProjectMemberRole.OWNER);
        return projectRepository.save(project);
    }

    @Override
    public Page<Project> getAll(
            int page,
            int size,
            String search,
            String privacy,
            Long organizationId,
            String membership
    ) {
        Sort sort = Sort.by(
                Sort.Order.desc("lastActivityAt"),
                Sort.Order.desc("id")
        );

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<Project> spec =
                projectSpecification.withFilters(search, privacy, organizationId);

        return projectRepository.findAll(spec, pageable);
    }

    @Override
    public List<Project> getAll(){
        return projectRepository.findAll();
    }

    @Override
    public Project getById(Long id){
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    @Override
    public Project getByTitle(String title){
        return projectRepository.findByTitle(title)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    @Override
    public List<Project> getByOrganization(Organization organization){
        return projectRepository.findByOrganization(organization);
    }

    @Override
    public List<Project> getByUser(User user){
        return projectRepository.findByUsers_User(user);
    }

    @Override
    @Transactional
    public Project update(ProjectUpdateRequest request, Project project){
        String title = request.name();
        if(projectRepository.existsByTitle(title)){
            throw new RuntimeException("409 PROJECT_NAME_CONFLICT");
        }
        if(title != null && !title.isEmpty()){
            project.setTitle(title);
        }
        String description = request.description();
        if(description != null && !description.isEmpty()){
            project.setDescription(description);
        }
        String repositoryUrl = request.repositoryUrl();
        if(repositoryUrl != null && !repositoryUrl.isEmpty()){
            project.setRepositoryUrl(repositoryUrl);
        }
        String stack = request.stack();
        if(stack != null && !stack.isEmpty()){
            project.setStack(stack);
        }
        Boolean isPrivate = request.isPrivate();
        if(isPrivate != null){
            project.setPrivate(isPrivate);
        }
        Boolean aiReviewEnable = request.aiReviewEnable();
        if(aiReviewEnable != null){
            project.setAiReviewEnabled(aiReviewEnable);
        }
        return projectRepository.save(project);
    }

    @Override
    public List<User> getUsersByProject(Project project){
        List<User> users = new ArrayList<>();
        Set<UserProject> userProjects = project.getUsers();
        for(UserProject userProject : userProjects){
            users.add(userProject.getUser());
        }
        return users;
    }

    @Override
    @Transactional
    public void delete(Long id){
        Project project = getById(id);
        projectRepository.delete(project);
    }

    @Override
    public boolean isProjectExist(String title, Organization organization){
        return projectRepository.findByTitleAndOrganization(title, organization).isPresent();
    }

    @Override
    public boolean isProjectExist(String title, User user){
        return projectRepository.findByTitleAndUsers_User(title, user).isPresent();
    }

    @Override
    public void addUserToProject(User user, Project project, ProjectMemberRole role) {
        project.addUser(user, role);
        projectRepository.save(project);
    }

    @Override
    @Transactional
    public void removeUserFromProject(User user, Project project){
        Optional<UserProject> userProject = userProjectRepository.findByUserAndProject(user, project);
        userProject.ifPresent(userProjectRepository::delete);
    }

    @Override
    public boolean isOwner(Project project, User user){
       return project.getUsers().stream()
                .anyMatch(up ->
                        up.getUser().getId().equals(user.getId()) &&
                                up.getProjectMemberRole() == ProjectMemberRole.OWNER
                );
    }
}
