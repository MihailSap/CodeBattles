package ru.urfu.backend.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserProjectRepository userProjectRepository;
    private final ProjectStackRepository projectStackRepository;
    private final StackService stackService;

    @Autowired
    public ProjectServiceImpl(
            ProjectRepository projectRepository,
            UserProjectRepository userProjectRepository,
            StackService stackService,
            ProjectStackRepository projectStackRepository
    ) {
        this.projectRepository = projectRepository;
        this.userProjectRepository = userProjectRepository;
        this.stackService = stackService;
        this.projectStackRepository = projectStackRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public ProjectMemberRole getProjectMemberRole(User user, Project project){
        Optional<UserProject> userProject = userProjectRepository.findByUserAndProject(user, project);
        if(userProject.isEmpty()) return ProjectMemberRole.GUEST;
        return userProject.get().getProjectMemberRole();
    }

    @Transactional(readOnly = true)
    @Override
    public List<Project> getPublicProjects(User user){
        List<Project> projects = projectRepository.findByIsPrivateFalseAndOrganizationNull();
        List<Project> result = new ArrayList<>();
        for(Project project : projects){
            if(!isUserProjectExists(project, user)){
                result.add(project);
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    @Override
    public UserProject getUserProject(User user, Project project){
        return userProjectRepository.findByUserAndProject(user, project)
                .orElseThrow(() -> new RuntimeException("Связь между данными User и Project не найдена"));
    }

    @Transactional(readOnly = true)
    @Override
    public Optional<UserProject> getOptionalUserProject(User user, Project project){
        return userProjectRepository.findByUserAndProject(user, project);
    }

    @Transactional
    @Override
    public Project create(ProjectCreateRequest request, User user, Organization organization){
        Project project = new Project();
        project.setOrganization(organization);
        return create(request, user, project);
    }

    @Transactional
    @Override
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

        UserProject userProject = new UserProject();
        userProject.setProject(savedProject);
        userProject.setUser(user);
        userProject.setProjectMemberRole(ProjectMemberRole.OWNER);
        userProjectRepository.save(userProject);

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

    @Transactional(readOnly = true)
    @Override
    public Project getById(Long id){
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    @Transactional
    @Override
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

    @Transactional
    @Override
    public void addUserToProject(User user, Project project, ProjectMemberRole role) {
        UserProject userProject = new UserProject();
        userProject.setUser(user);
        userProject.setProject(project);
        userProject.setProjectMemberRole(role);
        userProjectRepository.save(userProject);
    }

    @Transactional
    @Override
    public void removeUserFromProject(User user, Project project){
        Optional<UserProject> userProject = userProjectRepository.findByUserAndProject(user, project);
        userProject.ifPresent(userProjectRepository::delete);
    }

    @Transactional
    @Override
    public void delete(Long id){
        Project project = getById(id);
        projectRepository.delete(project);
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isProjectExist(String title, Organization organization){
        return projectRepository.findByTitleAndOrganization(title, organization).isPresent();
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isProjectExist(String title, User user){
        return projectRepository.findByTitleAndUsers_User(title, user).isPresent();
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isUserProjectExists(Project project, User user) {
        Optional<UserProject> userProjectOptional = userProjectRepository.findByUserAndProject(user, project);
        return userProjectOptional.isPresent();
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isUserMemberInProject(Project project, User user) {
        Optional<UserProject> userProjectOptional = userProjectRepository.findByUserAndProject(user, project);
        return userProjectOptional.isPresent()
                && ProjectMemberRole.MEMBER.equals(userProjectOptional.get().getProjectMemberRole());
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isUserOwnerInProject(Project project, User user) {
        Optional<UserProject> userProjectOptional = userProjectRepository.findByUserAndProject(user, project);
        return userProjectOptional.isPresent()
                && ProjectMemberRole.OWNER.equals(userProjectOptional.get().getProjectMemberRole());
    }
}
