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
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.repository.ProjectRepository;
import ru.urfu.backend.repository.ProjectStackRepository;
import ru.urfu.backend.repository.UserProjectRepository;
import ru.urfu.backend.service.ProjectService;
import ru.urfu.backend.service.StackService;
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
    private final StackService stackService;
    private final ProjectStackRepository projectStackRepository;

    @Autowired
    public ProjectServiceImpl(ProjectRepository projectRepository, ProjectSpecification projectSpecification, UserProjectRepository userProjectRepository, StackService stackService, ProjectStackRepository projectStackRepository) {
        this.projectRepository = projectRepository;
        this.projectSpecification = projectSpecification;
        this.userProjectRepository = userProjectRepository;
        this.stackService = stackService;
        this.projectStackRepository = projectStackRepository;
    }

    @Override
    public List<Project> getPublicProjects() {
        List<Project> projects = projectRepository.findAll();
        for (Project project : projects) {
            if(Boolean.FALSE.equals(project.getIsPrivate())){
                projects.add(project);
            }
        }
        return projects;
    }

    @Override
    public UserProject getUserProject(User user, Project project){
        return userProjectRepository.findByUserAndProject(user, project)
                .orElseThrow(() -> new RuntimeException("Связь между данными User и Project не найдена"));
    }

    @Override
    public boolean isUserInProject(Project project, User user) {
        Optional<UserProject> userProjectOptional = userProjectRepository.findByUserAndProject(user, project);
        return userProjectOptional.isPresent();
    }

    @Override
    public boolean isUserMemberOfProject(Project project, User user) {
        Optional<UserProject> userProjectOptional = userProjectRepository.findByUserAndProject(user, project);
        return userProjectOptional.isPresent()
                && (!ProjectMemberRole.OWNER.equals(userProjectOptional.get().getProjectMemberRole())
                    || ProjectMemberRole.MEMBER.equals(userProjectOptional.get().getProjectMemberRole()));
    }

    @Override
    public boolean isUserOwnerInProject(Project project, User user) {
        Optional<UserProject> userProjectOptional = userProjectRepository.findByUserAndProject(user, project);
        return userProjectOptional.isPresent()
                && ProjectMemberRole.OWNER.equals(userProjectOptional.get().getProjectMemberRole());
    }

    @Override
    @Transactional
    public Project create(ProjectCreateRequest request, User user, Organization organization){
        Project project = new Project();
        project.setOrganization(organization);
        return create(request, user, project);
    }

    @Override
    @Transactional
    public Project create(ProjectCreateRequest request, User user){
        Project project = new Project();
        return create(request, user, project);
    }

    @Transactional
    public Project create(ProjectCreateRequest request, User user, Project project){
        project.setTitle(request.name());
        project.setDescription(request.description());
        project.setRepositoryUrl(request.repositoryUrl());
        project.setPrivate(request.isPrivate());
        project.setAiReviewEnabled(request.aiReviewEnabled());

        Project savedProject = projectRepository.save(project);

        savedProject.addUser(user, ProjectMemberRole.OWNER);

        List<String> stackTitles = request.stack();
        for(String stackTitle : stackTitles){
            Stack stack = stackService.getOrCreate(stackTitle);
            ProjectStack projectStack = new ProjectStack();
            projectStack.setStack(stack);
            projectStack.setProject(savedProject);
            projectStackRepository.save(projectStack);
        }

        return projectRepository.save(savedProject);
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

        List<String> stackTitles = request.stack();
        if(stackTitles != null && !stackTitles.isEmpty()){
            project.getStacks().clear();
            for(String stackTitle : stackTitles){
                Stack stackObj = stackService.getOrCreate(stackTitle);
                ProjectStack projectStack = new ProjectStack();
                projectStack.setStack(stackObj);
                projectStack.setProject(project);
//                projectStackRepository.save(projectStack);
                project.getStacks().add(projectStack);
            }
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
}
