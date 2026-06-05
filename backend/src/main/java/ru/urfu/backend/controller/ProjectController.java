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
import ru.urfu.backend.exception.customEx.*;
import ru.urfu.backend.exception.globalEx.ForbiddenException;
import ru.urfu.backend.mapper.ProjectInviteMapper;
import ru.urfu.backend.mapper.ProjectMapper;
import ru.urfu.backend.mapper.TaskMapper;
import ru.urfu.backend.model.*;
import ru.urfu.backend.model.enums.ProjectMemberRole;
import ru.urfu.backend.model.enums.Role;
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
    private final ProjectInviteService projectInviteService;
    private final ProjectInviteMapper projectInviteMapper;
    private final AchievementService achievementService;
    private final NotificationService notificationService;

    @Autowired
    public ProjectController(
            ProjectMapper projectMapper,
            ProjectService projectService,
            OrganizationService organizationService,
            AuthService authService,
            ProjectInviteService projectInviteService,
            ProjectInviteMapper projectInviteMapper,
            AchievementService achievementService,
            NotificationService notificationService) {
        this.projectMapper = projectMapper;
        this.projectService = projectService;
        this.organizationService = organizationService;
        this.authService = authService;
        this.projectInviteService = projectInviteService;
        this.projectInviteMapper = projectInviteMapper;
        this.achievementService = achievementService;
        this.notificationService = notificationService;
    }

    @Operation(description = "Получение проектов пользователя")
    @GetMapping
    public List<ProjectListItemDto> getProjects(
    ) throws UserNotFoundException {
        User currentUser = authService.getAuthenticatedUser();
        Set<UserProject> userProjects = currentUser.getProjects();
        List<ProjectListItemDto> result = new ArrayList<>();
        for(UserProject userProject : userProjects) {
            result.add(projectMapper.mapToProjectListItemDto(
                    userProject.getProject(), userProject.getProjectMemberRole()));
        }

        return result;
    }

    @Operation(description = "Получение участников проекта по id")
    @GetMapping("/{projectId}/participants")
    public List<ProjectParticipantDto> getParticipants(@PathVariable("projectId") Long projectId) {
        Project project = projectService.getById(projectId);
        Set<UserProject> userProjects = project.getUsers();
        List<ProjectParticipantDto> result = new ArrayList<>();
        for (UserProject userProject : userProjects) {
            result.add(projectMapper.mapToProjectParticipantDto(userProject));
        }
        return result;
    }

    @Operation(description = "Создание проекта")
    @PostMapping
    public ResponseEntity<CreatedResponse> create(@RequestBody ProjectCreateRequest projectCreateRequest) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Long> achievementIdsBeforeAction = achievementService.getReceivedAchievementIds(user);
        if(projectCreateRequest.organizationId() == null){
            if(projectService.isProjectExist(projectCreateRequest.name(), user)){
                throw new ProjectNameConflictException("409 PROJECT_NAME_CONFLICT");
            }
            Project project = projectService.create(projectCreateRequest, user);
            notificationService.notifyNewAchievements(user, achievementIdsBeforeAction);
            return ResponseEntity.status(201).body(new CreatedResponse(project.getId()));
        }

        Organization organization = organizationService.getById(projectCreateRequest.organizationId());
        if(projectService.isProjectExist(projectCreateRequest.name(), organization)){
            throw new ProjectNameConflictException("409 PROJECT_NAME_CONFLICT");
        }
        if(!organizationService.isUserAdminInOrganization(user, organization)){
            throw new ForbiddenOrganizationException("403 FORBIDDEN_ORGANIZATION");
        }
        Project project = projectService.create(projectCreateRequest, user, organization);
        notificationService.notifyNewAchievements(user, achievementIdsBeforeAction);
        return ResponseEntity.status(201).body(new CreatedResponse(project.getId()));
    }

    @Operation(description = "Получение проекта по id")
    @GetMapping("/{projectId}")
    public ProjectDetailsDto getProjectById(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User user = authService.getAuthenticatedUser();

        if(project.getIsPrivate()
                && !projectService.isUserOwnerInProject(project, user)
                && !projectService.isUserMemberInProject(project, user)
                && !Role.ADMIN.equals(user.getRole())){
            throw new ForbiddenProjectException("403 FORBIDDEN_PROJECT");
        }

        Organization organization = project.getOrganization();
        if(organization != null 
                && !organizationService.isUserExistsInOrganization(organization, user)
                && !Role.ADMIN.equals(user.getRole())){
            throw new ForbiddenOrganizationException("403 FORBIDDEN_ORGANIZATION");
        }

        if(!projectService.isUserOwnerInProject(project, user)
                && !projectService.isUserMemberInProject(project, user)){
            return projectMapper.mapToProjectDetailsDto(project, ProjectMemberRole.GUEST);
        }

        UserProject userProject = projectService.getUserProject(user, project);
        return projectMapper.mapToProjectDetailsDto(project, userProject.getProjectMemberRole());
    }

    @Operation(description = "Обновление проекта по id")
    @PatchMapping("/{projectId}")
    public ProjectDetailsDto updateProjectById(
            @PathVariable("projectId") Long projectId, @RequestBody ProjectUpdateRequest request) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User user = authService.getAuthenticatedUser();
        if(!projectService.isUserOwnerInProject(project, user)){
            throw new ForbiddenProjectException("403 FORBIDDEN_PROJECT");
        }

        Project updatedProject = projectService.update(request, project);
        UserProject userProject = projectService.getUserProject(user, updatedProject);

        return projectMapper.mapToProjectDetailsDto(project, userProject.getProjectMemberRole());
    }

    @Operation(description = "Удаление проекта по id")
    @DeleteMapping("/{projectId}")
    public DeletedResponse deleteProjectById(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Project project = projectService.getById(projectId);

        if(!projectService.isUserOwnerInProject(project, user)){
            throw new ForbiddenProjectException("403 FORBIDDEN_PROJECT");
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
            throw new OwnerCannotLeaveProjectException("400 OWNER CAN'T LEAVE PROJECT");
        }
        if(!projectService.isUserProjectExists(project, user)){
            throw new ForbiddenException("Пользователь не состоит в проекте");
        }
        projectService.removeUserFromProject(user, project);
        return new LeftResponse(true);
    }

    @Operation(description = "Создание invite запроса")
    @PostMapping("/{projectId}/invites")
    public ProjectInviteResponse createInviteLink(
            @PathVariable("projectId") Long projectId, @RequestBody ProjectInviteRequest request) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User user = authService.getAuthenticatedUser();
        if(!projectService.isUserOwnerInProject(project, user)){
            throw new ForbiddenProjectException("403 FORBIDDEN_PROJECT");
        }

        ProjectInvite projectInvite = projectInviteService.create(request, project);
        return projectInviteMapper.mapToProjectInviteResponse(projectInvite);
    }

    @Operation(description = "Вступление пользователя в публичный проект")
    @PostMapping("/{projectId}/join")
    public ProjectJoinedResponse join(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User user = authService.getAuthenticatedUser();
        if(Boolean.TRUE.equals(project.getIsPrivate())){
            throw new ProjectNotPublicException("403 PROJECT_NOT_PUBLIC");
        }
        if(projectService.isUserProjectExists(project, user)){
            throw new AlreadyMemberException("409 ALREADY_MEMBER");
        }
        projectService.addUserToProject(user, project, ProjectMemberRole.MEMBER);
        return new ProjectJoinedResponse(true, project.getId());
    }

    @Operation(description = "Поиск публичных проектов для вступления")
    @GetMapping("/public/search")
    public List<ProjectListItemDto> search() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        List<Project> projects = projectService.getPublicProjects(user);
        List<ProjectListItemDto> projectListItemDtos = new ArrayList<>();
        for(var project : projects){
            projectListItemDtos.add(projectMapper.mapToProjectListItemDto(project, ProjectMemberRole.GUEST));
        }
        return projectListItemDtos;
    }
}
