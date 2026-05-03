package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.CreatedResponse;
import ru.urfu.backend.dto.DeletedResponse;
import ru.urfu.backend.dto.LeftResponse;
import ru.urfu.backend.dto.invite.ProjectInviteRequest;
import ru.urfu.backend.dto.invite.ProjectInviteResponse;
import ru.urfu.backend.dto.project.*;
import ru.urfu.backend.dto.tasks.TaskCreateRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.ProjectInviteMapper;
import ru.urfu.backend.mapper.ProjectMapper;
import ru.urfu.backend.mapper.TaskMapper;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.service.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Tag(name = "Управление проектами")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.PROJECTS)
public class ProjectController {

    private final ProjectMapper projectMapper;
    private final ProjectService projectService;
    private final OrganizationService organizationService;
    private final AuthService authService;
    private final TaskService taskService;
    private final TaskMapper taskMapper;
    private final ProjectInviteService projectInviteService;
    private final ProjectInviteMapper projectInviteMapper;

    @Autowired
    public ProjectController(
            ProjectMapper projectMapper,
            ProjectService projectService,
            OrganizationService organizationService,
            AuthService authService,
            TaskService taskService,
            TaskMapper taskMapper,
            ProjectInviteService projectInviteService,
            ProjectInviteMapper projectInviteMapper) {
        this.projectMapper = projectMapper;
        this.projectService = projectService;
        this.organizationService = organizationService;
        this.authService = authService;
        this.taskService = taskService;
        this.taskMapper = taskMapper;
        this.projectInviteService = projectInviteService;
        this.projectInviteMapper = projectInviteMapper;
    }

    @Operation(description = "Получение проектов текущего пользователя")
    @GetMapping("/my")
    public List<ProjectListItemDto> getProjects(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Boolean isPrivate,
            @RequestParam(required = false) Long organizationId,
            @RequestParam(required = false) ProjectMemberRole membership
    ) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<UserProject> userProjects = new ArrayList<>();
        for (UserProject userProject : user.getProjects()) {
            Project project = userProject.getProject();
            if((name != null && name.equals(project.getTitle()))
                || (isPrivate != null && !isPrivate.equals(project.getIsPrivate()))
                || (organizationId != null && !organizationId.equals(project.getOrganization().getId()))
                || (membership != null && !membership.equals(userProject.getProjectMemberRole()))){
                continue;
            }
            userProjects.add(userProject);
        }
        return projectMapper.mapToProjectListItemDtos(userProjects);
    }

    @Operation(description = "Получение участников проекта по id")
    @GetMapping("/{projectId}/participants")
    public List<ProjectParticipantDto> getParticipants(
            @PathVariable("projectId") Long projectId,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String login,
            @RequestParam(required = false) ProjectMemberRole role
    ){
        Project project = projectService.getById(projectId);
        List<UserProject> userProjects = new ArrayList<>();
        for(UserProject userProject : project.getUsers()){
            User user = userProject.getUser();
            if((fullName != null && !fullName.equals(user.getFullName()))
                || (login != null && !login.equals(user.getLogin()))
                || (role != null && !role.equals(userProject.getProjectMemberRole()))){
                continue;
            }
            userProjects.add(userProject);
        }
        return projectMapper.mapToProjectParticipantDtos(userProjects);
    }

    @Operation(description = "Создание проекта")
    @PostMapping
    public ResponseEntity<CreatedResponse> create(@RequestBody ProjectCreateRequest projectCreateRequest) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        if(projectCreateRequest.organizationId() == null){
            if(projectService.isProjectExist(projectCreateRequest.name(), user)){
                throw new RuntimeException("409 PROJECT_NAME_CONFLICT");
            }
            Project project = projectService.create(projectCreateRequest, user);
            return ResponseEntity.status(201).body(new CreatedResponse(project.getId()));
        }

        Organization organization = organizationService.getById(projectCreateRequest.organizationId());
        if(projectService.isProjectExist(projectCreateRequest.name(), organization)){
            throw new RuntimeException("409 PROJECT_NAME_CONFLICT");
        }
        if(organizationService.isUserAdminInOrganization(user, organization)){
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }
        Project project = projectService.create(projectCreateRequest, user, organization);
        return ResponseEntity.status(201).body(new CreatedResponse(project.getId()));
    }

    @Operation(description = "Получение проекта по id")
    @GetMapping("/{projectId}")
    public ProjectDetailsDto getProjectById(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User user = authService.getAuthenticatedUser();
        UserProject userProject = projectService.getUserProject(user, project);

        if(project.getIsPrivate() && !projectService.isUserInProject(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        Organization organization = project.getOrganization();
        if(organization != null && !organizationService.isOrganizationContainsUser(organization, user)){
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }

        if(!project.getIsPrivate()
                && organization != null
                && !organizationService.isOrganizationContainsUser(organization, user)){
            return projectMapper.mapToProjectDetailsDto(project);
        }

        return projectMapper.mapToProjectDetailsDto(project, userProject);
    }

    @Operation(description = "Обновление проекта по id")
    @PatchMapping("/{projectId}")
    public ProjectDetailsDto updateProjectById(
            @PathVariable("projectId") Long projectId, @RequestBody ProjectUpdateRequest request) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User user = authService.getAuthenticatedUser();
        if(!projectService.isUserOwnerInProject(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        Project updatedProject = projectService.update(request, project);
        UserProject userProject = projectService.getUserProject(user, updatedProject);

        return projectMapper.mapToProjectDetailsDto(project, userProject);
    }

    @Operation(description = "Удаление проекта по id")
    @DeleteMapping("/{projectId}")
    public DeletedResponse deleteProjectById(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Project project = projectService.getById(projectId);

        if(!projectService.isUserOwnerInProject(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        projectService.delete(projectId);

        return new DeletedResponse(true);
    }

    @Operation(description = "Выход из проекта")
    @PostMapping("/{projectId}/leave")
    public LeftResponse leaveProjectById(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Project project = projectService.getById(projectId);
        if(projectService.isUserOwnerInProject(project, user)){
            throw new RuntimeException("400 OWNER CAN'T LEAVE PROJECT");
        }
        if(!projectService.isUserInProject(project, user)){
            throw new RuntimeException("Пользователь не состоит в проекте");
        }
        projectService.removeUserFromProject(user, project);
        return new LeftResponse(true);
    }

    //FIXME: Пагинация
    @Operation(description = "Получение задач проекта по id")
    @GetMapping("/{projectId}/tasks")
    public List<ProjectTaskDto> getProjectTasks(@PathVariable("projectId") Long projectId){
        Project project = projectService.getById(projectId);
        Set<Task> tasks = project.getTasks();
        List<ProjectTaskDto> projectTaskDtos = new ArrayList<>();
        for(var task : tasks){
            ProjectTaskDto projectTaskDto = taskMapper.mapToProjectTaskDto(task);
            projectTaskDtos.add(projectTaskDto);
        }
        return projectTaskDtos;
    }

    @Operation(description = "Создание задачи для проекта")
    @PostMapping("/{projectId}/tasks")
    public ResponseEntity<CreatedResponse> createTask(
            @PathVariable("projectId") Long projectId, @RequestBody TaskCreateRequest request) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        Task task = taskService.create(request, project);
        return ResponseEntity.status(201).body(new CreatedResponse(task.getId()));
    }

    @Operation(description = "Получение задачи проекта")
    @GetMapping("/{projectId}/tasks/{taskId}")
    public ProjectTaskDto getTaskById(
            @PathVariable("projectId") Long projectId, @PathVariable("taskId") Long taskId
    ){
        Task task = taskService.getById(taskId);
        return taskMapper.mapToProjectTaskDto(task);
    }

    @Operation(description = "Создание invite запроса")
    @PostMapping("/{projectId}/invites")
    public ProjectInviteResponse createInviteLink(
            @PathVariable("projectId") Long projectId, @RequestBody ProjectInviteRequest request) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User user = authService.getAuthenticatedUser();
        if(!projectService.isUserOwnerInProject(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        ProjectInvite projectInvite = projectInviteService.create(request, project);
        return projectInviteMapper.mapToProjectInviteResponse(projectInvite);
    }

    @Operation(description = "Вступление пользователя в проект")
    @PostMapping("/{projectId}/join")
    public ProjectJoinedResponse join(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User user = authService.getAuthenticatedUser();
        if(Boolean.FALSE.equals(project.getIsPrivate())){
            throw new RuntimeException("403 PROJECT_NOT_PUBLIC");
        }
        if(projectService.isUserInProject(project, user)){
            throw new RuntimeException("409 ALREADY_MEMBER");
        }
        if(project.getOrganization() == null){
            throw new RuntimeException("403 FORBIDDEN_ORGANIZATION");
        }
        projectService.addUserToProject(user, project, ProjectMemberRole.MEMBER);
        return new ProjectJoinedResponse(true, project.getId());
    }

    @Operation(description = "Получение публичных проектов")
    @GetMapping("/public/search")
    public List<ProjectListItemDto> getPublicProjects() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Project> projects = projectService.getPublicProjects();
        List<ProjectListItemDto> projectListItemDtos = new ArrayList<>();
        for(Project project : projects){
            if(projectService.isUserMemberOfProject(project, user)){
                continue;
            }
            ProjectListItemDto projectListItemDto = projectMapper.mapToProjectListItemDto(project);
            projectListItemDtos.add(projectListItemDto);
        }
        return projectListItemDtos;
    }
}
