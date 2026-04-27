package ru.urfu.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.urfu.backend.PathsConstants;
import ru.urfu.backend.dto.CreatedResponse;
import ru.urfu.backend.dto.DeletedResponse;
import ru.urfu.backend.dto.LeftResponse;
import ru.urfu.backend.dto.invite.InviteRequest;
import ru.urfu.backend.dto.invite.InviteResponse;
import ru.urfu.backend.dto.project.*;
import ru.urfu.backend.dto.tasks.TaskCreateRequest;
import ru.urfu.backend.exception.customEx.UserNotFoundException;
import ru.urfu.backend.mapper.ProjectMapper;
import ru.urfu.backend.mapper.TaskMapper;
import ru.urfu.backend.model.*;
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

    @Autowired
    public ProjectController(
            ProjectMapper projectMapper, ProjectService projectService, OrganizationService organizationService, AuthService authService, TaskService taskService, TaskMapper taskMapper) {
        this.projectMapper = projectMapper;
        this.projectService = projectService;
        this.organizationService = organizationService;
        this.authService = authService;
        this.taskService = taskService;
        this.taskMapper = taskMapper;
    }

    //FIXME: Пагинация
    @GetMapping
    public List<ProjectListItemDto> getProjects() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Set<UserProject> projects = user.getProjects();
        List<ProjectListItemDto> projectListItemDtos = new ArrayList<>();
        for (UserProject userProject : projects) {
            ProjectListItemDto projectListItemDto = projectMapper.mapToProjectListItemDto(userProject);
            projectListItemDtos.add(projectListItemDto);
        }
        return projectListItemDtos;
    }

    @Operation(description = "Создание проекта для организации по её id")
    @PostMapping
    public ResponseEntity<CreatedResponse> createProject(@RequestBody ProjectCreateRequest projectCreateRequest) {
        Organization organization = organizationService.getById(projectCreateRequest.ownerId());
        if(projectService.isProjectExist(projectCreateRequest.name(), organization)){
            //TODO: Реализовать корректную обработку ошибок
            throw new RuntimeException("409 PROJECT_NAME_CONFLICT");
        }
        Project project = projectService.create(projectCreateRequest, organization);
        return ResponseEntity.status(201).body(new CreatedResponse(project.getId()));
    }

    @GetMapping("/{projectId}")
    public ProjectDetailsDto getProjectById(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        User user = authService.getAuthenticatedUser();
        UserProject userProject = projectService.getUserProject(user, project);
        return projectMapper.mapToProjectDetailsDto(project, userProject);
    }

    @PatchMapping("/{projectId}")
    public ProjectDetailsDto updateProjectById(
            @PathVariable("projectId") Long projectId, @RequestBody ProjectUpdateRequest request) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        Project updatedProject = projectService.update(request, project);

        User user = authService.getAuthenticatedUser();
        UserProject userProject = projectService.getUserProject(user, updatedProject);
        return projectMapper.mapToProjectDetailsDto(updatedProject, userProject);
    }

    @Operation(description = "Удаление проекта по id")
    @DeleteMapping("/{projectId}")
    public DeletedResponse deleteProjectById(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Project project = projectService.getById(projectId);

        if(!projectService.isOwner(project, user)){
            throw new RuntimeException("403 FORBIDDEN_PROJECT");
        }

        projectService.delete(projectId);

        return new DeletedResponse(true);
    }

    @PostMapping("/{projectId}/leave")
    public LeftResponse leaveProjectById(@PathVariable("projectId") Long projectId) throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        Project project = projectService.getById(projectId);
        projectService.removeUserFromProject(user, project);
        return new LeftResponse(true);
    }

    //FIXME: Пагинация
    @GetMapping("/{projectId}/participants")
    public List<ProjectParticipantDto> getParticipants(@PathVariable("projectId") Long projectId){
        Project project = projectService.getById(projectId);
        Set<UserProject> userProjects = project.getUsers();
        List<ProjectParticipantDto> participantDtos = new ArrayList<>();
        for (UserProject userProject : userProjects) {
            ProjectParticipantDto projectParticipantDto = projectMapper.mapToProjectParticipantDto(userProject);
            participantDtos.add(projectParticipantDto);
        }
        return participantDtos;
    }

    //FIXME: Пагинация
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

    @PostMapping("/{projectId}/tasks")
    public ResponseEntity<CreatedResponse> createTask(
            @PathVariable("projectId") Long projectId, @RequestBody TaskCreateRequest request) throws UserNotFoundException {
        Project project = projectService.getById(projectId);
        Task task = taskService.create(request, project);
        return ResponseEntity.status(201).body(new CreatedResponse(task.getId()));
    }

    @GetMapping("/{projectId}/tasks/{taskId}")
    public ProjectTaskDto getTaskById(
            @PathVariable("projectId") Long projectId, @PathVariable("taskId") Long taskId
    ){
        Task task = taskService.getById(taskId);
        return taskMapper.mapToProjectTaskDto(task);
    }

//    @PostMapping("/{projectId}/invites")
//    public InviteResponse createInviteLink(
//            @PathVariable("projectId") Long projectId, @RequestBody InviteRequest request){
//
//    }

    @GetMapping("/public/search")
    public List<ProjectListItemDto> getPublicProjects(){
        List<Project> publicProjects = projectService.getPublicProjects();
        return projectMapper.mapToProjectListItemDtos(publicProjects);
    }
}
