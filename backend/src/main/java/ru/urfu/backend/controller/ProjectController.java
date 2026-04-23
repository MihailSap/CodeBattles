package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.CreatedResponse;
import ru.urfu.backend.dto.user.UserResponse;
import ru.urfu.backend.dto.userProject.AddUserToProjectRequest;
import ru.urfu.backend.dto.project.ProjectCreateRequest;
import ru.urfu.backend.dto.project.ProjectResponse;
import ru.urfu.backend.dto.project.ProjectUpdateRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.ProjectMapper;
import ru.urfu.backend.mapper.UserMapper;
import ru.urfu.backend.model.Organization;
import ru.urfu.backend.model.Project;
import ru.urfu.backend.model.User;
import ru.urfu.backend.service.AuthService;
import ru.urfu.backend.service.OrganizationService;
import ru.urfu.backend.service.ProjectService;
import ru.urfu.backend.service.UserService;

import java.util.ArrayList;
import java.util.List;

@Tag(name = "Управление проектами")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.PROJECTS)
public class ProjectController {

    private final ProjectMapper projectMapper;
    private final ProjectService projectService;
    private final OrganizationService organizationService;
    private final AuthService authService;
    private final UserService userService;
    private final UserMapper userMapper;

    @Autowired
    public ProjectController(
            ProjectMapper projectMapper, ProjectService projectService, OrganizationService organizationService, AuthService authService, UserService userService, UserMapper userMapper) {
        this.projectMapper = projectMapper;
        this.projectService = projectService;
        this.organizationService = organizationService;
        this.authService = authService;
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @Operation(description = "Получение проекта по id")
    @GetMapping("/by-id/{projectId}")
    public ProjectResponse getById(@PathVariable("projectId") Long projectId){
        Project project = projectService.getById(projectId);
        return projectMapper.mapToProjectResponse(project);
    }

    @Operation(description = "Получение проекта по title")
    @GetMapping("/by-title/{title}")
    public ProjectResponse getByTitle(@PathVariable("title") String title){
        Project project = projectService.getByTitle(title);
        return projectMapper.mapToProjectResponse(project);
    }

    @Operation(description = "Получение проекта по organizationId")
    @GetMapping("/by-organization/{organizationId}")
    public List<ProjectResponse> getByOrganizationId(@PathVariable("organizationId") Long organizationId){
        Organization organization = organizationService.getById(organizationId);
        List<Project> projects = projectService.getByOrganization(organization);
        return projectMapper.mapToProjectResponses(projects);
    }

    @Operation(description = "Получение проекта по organizationId")
    @GetMapping("/by-user/{userId}")
    public List<ProjectResponse> getByUserId(@PathVariable("userId") Long userId) throws UserNotFoundException {
        User user = userService.getById(userId);
        List<Project> projects = projectService.getByUser(user);
        return projectMapper.mapToProjectResponses(projects);
    }

    @Operation(description = "Получение проекта по projectId")
    @GetMapping("/users/{projectId}")
    public List<UserResponse> getUsersByProjectId(@PathVariable("projectId") Long projectId) {
        Project project = projectService.getById(projectId);
        List<User> users = projectService.getUsersByProject(project);

        List<UserResponse> responses = new ArrayList<>();
        for(User user : users){
            responses.add(userMapper.mapToUserResponse(user));
        }
        return responses;
    }

    @Operation(description = "Создание проекта для организации по её id")
    @PostMapping("/create-by-organization")
    public ResponseEntity<CreatedResponse> createByOrganization(@RequestBody ProjectCreateRequest projectCreateRequest){
        Organization organization = organizationService.getById(projectCreateRequest.ownerId());
        if(projectService.isProjectExist(projectCreateRequest.name(), organization)){
            //TODO: Реализовать корректную обработку ошибок
            throw new RuntimeException("409 PROJECT_NAME_CONFLICT");
        }
        Project project = projectService.create(projectCreateRequest, organization);
        return ResponseEntity.status(201).body(new CreatedResponse(project.getId()));
    }

    //TODO
    @Operation(description = "Создание проекта для организации по её id")
    @PostMapping("/create-by-user")
    public ResponseEntity<CreatedResponse> createByUser(@RequestBody ProjectCreateRequest projectCreateRequest) throws UserNotFoundException {
        User user = userService.getById(projectCreateRequest.ownerId());
        if(projectService.isProjectExist(projectCreateRequest.name(), user)){
            //TODO: Реализовать корректную обработку ошибок
            throw new RuntimeException("409 PROJECT_NAME_CONFLICT");
        }
        Project project = projectService.create(projectCreateRequest, user);
        return ResponseEntity.status(201).body(new CreatedResponse(project.getId()));
    }

    @Operation(description = "Добавление пользователя в проект")
    @PostMapping("/{projectId}/add/{userId}")
    public void addUser(@RequestBody AddUserToProjectRequest addUserToProjectRequest) throws UserNotFoundException {
        User user = userService.getById(addUserToProjectRequest.userId());
        Project project = projectService.getById(addUserToProjectRequest.projectId());
        projectService.addUserToProject(user, project, addUserToProjectRequest.role());
    }

    @Operation(description = "Обновление данных проекта по id")
    @PatchMapping("/{projectId}")
    public ProjectResponse update(@PathVariable("projectId") Long projectId, ProjectUpdateRequest projectUpdateRequest) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Project project = projectService.getById(projectId);

        if(!projectService.isOwner(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        Project updatedProject = projectService.update(projectUpdateRequest, project);
        return projectMapper.mapToProjectResponse(updatedProject);
    }

    @Operation(description = "Удаление пользователя из проекта")
    @DeleteMapping("/{projectId}/delete/{userId}")
    public void deleteUser(@PathVariable("projectId") Long projectId, @PathVariable("userId") Long userId) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User authUser = authService.getAuthenticatedUser();
        if(!projectService.isOwner(project, authUser)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        User user = userService.getById(userId);
        projectService.removeUserFromProject(user, project);
    }

    @Operation(description = "Выход из проекта")
    @DeleteMapping("/{projectId}/delete/current")
    public void leave(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        User authUser = authService.getAuthenticatedUser();
        Project project = projectService.getById(projectId);
        projectService.removeUserFromProject(authUser, project);
    }

    @Operation(description = "Удаление проекта по id")
    @DeleteMapping("/{projectId}")
    public void delete(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Project project = projectService.getById(projectId);

        if(!projectService.isOwner(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        projectService.delete(projectId);
    }
}
